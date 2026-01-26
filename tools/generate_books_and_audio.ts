#!/usr/bin/env tsx
/**
 * Batch Book Generator Script
 *
 * Generates books with text (Anthropic), images (Imagen), and audio (Gemini TTS)
 * Supports resume from crashes, retries, and progress tracking
 *
 * Usage:
 *   npm run generate -- --count=1000 --ageRange=3-5
 *   npm run generate -- --resume
 *   npm run generate -- --count=100 --startIndex=500
 */

import * as admin from 'firebase-admin';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import pLimit from 'p-limit';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface BatchProgress {
  batchId: string;
  totalBooks: number;
  completedBooks: number;
  failedBooks: number;
  skippedAudio: number;
  currentIndex: number;
  startedAt: Date;
  updatedAt: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  config: BatchConfig;
  failures: FailureRecord[];
}

interface FailureRecord {
  index: number;
  bookId?: string;
  error: string;
  timestamp: Date;
  phase: 'text' | 'images' | 'audio';
}

interface BatchConfig {
  count: number;
  startIndex: number;
  ageRange: '3-5' | '6-8' | '9-12';
  voiceName: string;
  textConcurrency: number;
  imageConcurrency: number;
  audioConcurrency: number;
  generateAudio: boolean;
}

interface GenerationStats {
  totalBooks: number;
  generatedBooks: number;
  generatedAudio: number;
  skippedAudioAlreadyCached: number;
  failures: number;
  startTime: Date;
  endTime?: Date;
}

// Initialize Firebase Admin
function initializeFirebase() {
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '..', 'service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
    });
  } else {
    // Use default credentials (for Cloud environment)
    admin.initializeApp();
  }

  console.log(chalk.green('✓ Firebase initialized'));
}

// Progress file for resume capability
const PROGRESS_FILE = path.join(__dirname, '.batch_progress.json');

function saveProgress(progress: BatchProgress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadProgress(): BatchProgress | null {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return null;
}

function clearProgress(): void {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

// Import services dynamically to avoid initialization issues
async function loadServices() {
  // Set up environment for services
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  // We'll call Cloud Functions instead of importing directly
  // This ensures API keys stay on the server
  return {
    callGenerateBook: async (config: any) => {
      const functions = admin.functions();
      const generateBook = functions.httpsCallable('generateBook');
      const result = await generateBook(config);
      return result.data;
    },
    callGenerateAudio: async (bookId: string, voiceName: string, force: boolean) => {
      const functions = admin.functions();
      const generateAudio = functions.httpsCallable('generateAudio');
      const result = await generateAudio({ bookId, voiceName, force });
      return result.data;
    },
  };
}

// Generate a single book
async function generateSingleBook(
  index: number,
  config: BatchConfig,
  services: any,
  spinner: any
): Promise<{ success: boolean; bookId?: string; error?: string; audioSkipped?: boolean }> {
  spinner.text = `Generating book ${index + 1}/${config.count}...`;

  try {
    // Vary themes based on age range for diversity
    const themes = getThemesForAge(config.ageRange);
    const theme = themes[(index) % themes.length];

    const result = await services.callGenerateBook({
      ageRange: config.ageRange,
      theme,
      generateAudio: config.generateAudio,
      voiceName: config.voiceName,
    });

    if (result.success) {
      return {
        success: true,
        bookId: result.bookId,
        audioSkipped: !result.audioGenerated,
      };
    } else {
      return {
        success: false,
        bookId: result.bookId,
        error: result.error || 'Unknown error',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Generation failed',
    };
  }
}

function getThemesForAge(ageRange: string): string[] {
  const themes: Record<string, string[]> = {
    '3-5': [
      'friendship', 'sharing', 'colors', 'animals', 'family',
      'bedtime', 'nature', 'kindness', 'counting', 'seasons',
      'first day of school', 'making friends', 'helping at home',
      'learning letters', 'bath time', 'playground fun',
      'pet care', 'healthy eating', 'feelings', 'imagination'
    ],
    '6-8': [
      'adventure', 'courage', 'teamwork', 'discovery', 'helping others',
      'imagination', 'problem solving', 'science', 'space', 'ocean',
      'dinosaurs', 'sports', 'music', 'art', 'nature exploration',
      'friendship challenges', 'new experiences', 'fairy tales',
      'superheroes', 'mystery solving'
    ],
    '9-12': [
      'perseverance', 'leadership', 'empathy', 'environment', 'history',
      'technology', 'creativity', 'responsibility', 'diversity', 'dreams',
      'invention', 'ancient civilizations', 'space exploration', 'coding',
      'entrepreneurship', 'social justice', 'world cultures',
      'scientific discovery', 'time travel', 'mythology'
    ]
  };

  return themes[ageRange] || themes['6-8'];
}

// Main batch generation function
async function runBatchGeneration(options: {
  count: number;
  startIndex: number;
  ageRange: '3-5' | '6-8' | '9-12';
  voiceName: string;
  textConcurrency: number;
  imageConcurrency: number;
  audioConcurrency: number;
  generateAudio: boolean;
  resume: boolean;
}) {
  console.log(chalk.bold.blue('\n📚 Kids Storybook Batch Generator\n'));

  // Check for resume
  let progress: BatchProgress | null = null;

  if (options.resume) {
    progress = loadProgress();
    if (!progress) {
      console.log(chalk.yellow('No previous progress found. Starting fresh.'));
    } else {
      console.log(chalk.green(`Resuming from index ${progress.currentIndex}`));
      options.count = progress.config.count;
      options.startIndex = progress.currentIndex;
      options.ageRange = progress.config.ageRange;
      options.voiceName = progress.config.voiceName;
    }
  }

  // Initialize Firebase
  initializeFirebase();

  // Load services
  console.log('Loading services...');
  const services = await loadServices();

  // Initialize progress
  const batchId = progress?.batchId || `batch_${Date.now()}`;
  const config: BatchConfig = {
    count: options.count,
    startIndex: options.startIndex,
    ageRange: options.ageRange,
    voiceName: options.voiceName,
    textConcurrency: options.textConcurrency,
    imageConcurrency: options.imageConcurrency,
    audioConcurrency: options.audioConcurrency,
    generateAudio: options.generateAudio,
  };

  if (!progress) {
    progress = {
      batchId,
      totalBooks: options.count,
      completedBooks: 0,
      failedBooks: 0,
      skippedAudio: 0,
      currentIndex: options.startIndex,
      startedAt: new Date(),
      updatedAt: new Date(),
      status: 'running',
      config,
      failures: [],
    };
  }

  // Save initial progress
  saveProgress(progress);

  // Also save to Firestore
  const db = admin.firestore();
  await db.collection('batchProgress').doc(batchId).set({
    ...progress,
    startedAt: admin.firestore.Timestamp.fromDate(progress.startedAt),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(chalk.cyan(`\nBatch ID: ${batchId}`));
  console.log(chalk.cyan(`Books to generate: ${options.count - options.startIndex}`));
  console.log(chalk.cyan(`Age range: ${options.ageRange}`));
  console.log(chalk.cyan(`Voice: ${options.voiceName}`));
  console.log(chalk.cyan(`Generate audio: ${options.generateAudio}`));
  console.log();

  // Stats
  const stats: GenerationStats = {
    totalBooks: options.count - options.startIndex,
    generatedBooks: 0,
    generatedAudio: 0,
    skippedAudioAlreadyCached: 0,
    failures: 0,
    startTime: new Date(),
  };

  // Concurrency limiter (generate one book at a time for reliability)
  const limit = pLimit(1);
  const spinner = ora('Starting...').start();

  // Generate books sequentially for reliability
  for (let i = options.startIndex; i < options.count; i++) {
    const result = await limit(() => generateSingleBook(i, config, services, spinner));

    if (result.success) {
      stats.generatedBooks++;
      if (result.audioSkipped) {
        stats.skippedAudioAlreadyCached++;
      } else {
        stats.generatedAudio++;
      }
      progress.completedBooks++;
      spinner.succeed(chalk.green(`Book ${i + 1}/${options.count} generated: ${result.bookId}`));
    } else {
      stats.failures++;
      progress.failedBooks++;
      progress.failures.push({
        index: i,
        bookId: result.bookId,
        error: result.error || 'Unknown error',
        timestamp: new Date(),
        phase: 'text',
      });
      spinner.fail(chalk.red(`Book ${i + 1} failed: ${result.error}`));
    }

    // Update progress
    progress.currentIndex = i + 1;
    progress.updatedAt = new Date();
    saveProgress(progress);

    // Update Firestore periodically (every 10 books)
    if ((i + 1) % 10 === 0) {
      await db.collection('batchProgress').doc(batchId).update({
        completedBooks: progress.completedBooks,
        failedBooks: progress.failedBooks,
        currentIndex: progress.currentIndex,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Small delay between books to avoid rate limiting
    if (i < options.count - 1) {
      await sleep(2000);
    }

    spinner.start();
  }

  spinner.stop();

  // Complete
  stats.endTime = new Date();
  progress.status = stats.failures === stats.totalBooks ? 'failed' : 'completed';

  saveProgress(progress);
  await db.collection('batchProgress').doc(batchId).update({
    status: progress.status,
    completedBooks: progress.completedBooks,
    failedBooks: progress.failedBooks,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Print summary
  const duration = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;

  console.log(chalk.bold.blue('\n' + '='.repeat(50)));
  console.log(chalk.bold.blue('📊 GENERATION SUMMARY'));
  console.log(chalk.bold.blue('='.repeat(50)));
  console.log();
  console.log(chalk.white(`Total books requested:    ${stats.totalBooks}`));
  console.log(chalk.green(`Books generated:          ${stats.generatedBooks}`));
  console.log(chalk.green(`Audio generated:          ${stats.generatedAudio}`));
  console.log(chalk.yellow(`Audio skipped (cached):   ${stats.skippedAudioAlreadyCached}`));
  console.log(chalk.red(`Failures:                 ${stats.failures}`));
  console.log();
  console.log(chalk.cyan(`Duration:                 ${formatDuration(duration)}`));
  console.log(chalk.cyan(`Avg per book:             ${(duration / stats.totalBooks).toFixed(1)}s`));
  console.log();

  if (stats.failures > 0) {
    console.log(chalk.yellow('Failed books are recorded in .batch_progress.json'));
    console.log(chalk.yellow('Run: npm run retry-failed to retry them'));
  } else {
    clearProgress();
  }

  console.log(chalk.bold.green('\n✅ Batch generation complete!\n'));

  process.exit(stats.failures > 0 ? 1 : 0);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI setup
const program = new Command();

program
  .name('generate_books_and_audio')
  .description('Batch generate kids storybooks with text, images, and audio')
  .version('1.0.0')
  .option('-c, --count <number>', 'Number of books to generate', '10')
  .option('-s, --startIndex <number>', 'Starting index (for resume)', '0')
  .option('-a, --ageRange <range>', 'Age range: 3-5, 6-8, or 9-12', '6-8')
  .option('-v, --voiceName <name>', 'Gemini voice: Kore, Aoede, Charon, etc.', 'Kore')
  .option('--textConcurrency <number>', 'Max concurrent text generations', '3')
  .option('--imageConcurrency <number>', 'Max concurrent image generations', '2')
  .option('--audioConcurrency <number>', 'Max concurrent audio generations', '2')
  .option('--no-audio', 'Skip audio generation')
  .option('-r, --resume', 'Resume from previous progress')
  .action((options) => {
    runBatchGeneration({
      count: parseInt(options.count),
      startIndex: parseInt(options.startIndex),
      ageRange: options.ageRange as '3-5' | '6-8' | '9-12',
      voiceName: options.voiceName,
      textConcurrency: parseInt(options.textConcurrency),
      imageConcurrency: parseInt(options.imageConcurrency),
      audioConcurrency: parseInt(options.audioConcurrency),
      generateAudio: options.audio !== false,
      resume: options.resume || false,
    }).catch((error) => {
      console.error(chalk.red('\n❌ Fatal error:'), error.message);
      process.exit(1);
    });
  });

program.parse();
