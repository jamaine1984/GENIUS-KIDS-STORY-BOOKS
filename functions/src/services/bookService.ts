/**
 * Book Service - Orchestrates complete book generation
 * Combines text (Anthropic), images (Imagen), and audio (Gemini TTS)
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import {
  Book,
  BookPage,
  BookGenerationRequest,
  AudioMetadata,
  GenerationResult,
  GeminiVoice
} from '../types/book';
import { generateBookText } from './anthropicService';
import { generateAllBookImages, generateCoverImage } from './imagenService';
import { generateBookAudio, computeAudioHash } from './audioService';

/**
 * Generate a unique book ID
 */
function generateBookId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `book_${timestamp}_${random}`;
}

/**
 * Compute text hash for cache invalidation
 */
function computeTextHash(pages: Array<{ text: string }>): string {
  const allText = pages.map(p => p.text).join('|');
  return crypto.createHash('sha256').update(allText).digest('hex').substring(0, 16);
}

/**
 * Count total words in book
 */
function countWords(pages: Array<{ text: string }>): number {
  return pages.reduce((total, page) => {
    return total + page.text.split(/\s+/).filter(w => w.length > 0).length;
  }, 0);
}

/**
 * Create initial audio metadata
 */
function createInitialAudioMetadata(): AudioMetadata {
  return {
    status: 'missing',
    voiceProvider: 'gemini',
    voiceName: '',
    format: 'mp3',
    durationSec: null,
    storagePath: '',
    publicUrl: '',
    generatedAt: null,
    hash: '',
  };
}

/**
 * Generate a complete book with text, images, and optionally audio
 */
export async function generateCompleteBook(
  request: BookGenerationRequest,
  generateAudio: boolean = true,
  voiceName: GeminiVoice = 'Kore'
): Promise<GenerationResult> {
  const db = admin.firestore();
  const bookId = generateBookId();

  console.log(`Starting complete book generation: ${bookId}`);
  console.log(`Request:`, JSON.stringify(request));

  try {
    // Step 1: Generate book text using Anthropic Claude
    console.log('Step 1: Generating book text with Anthropic Claude...');
    const bookContent = await generateBookText(request);
    console.log(`Generated: "${bookContent.title}" with ${bookContent.pages.length} pages`);

    // Create initial book document
    const textHash = computeTextHash(bookContent.pages);
    const wordCount = countWords(bookContent.pages);

    const initialBook: Omit<Book, 'createdAt' | 'updatedAt'> = {
      bookId,
      title: bookContent.title,
      author: bookContent.author || 'AI Storybook Creator',
      coverImageUrl: '',
      coverImageStoragePath: '',
      synopsis: bookContent.synopsis,
      ageRange: request.ageRange,
      readingLevel: getReadingLevel(request.ageRange),
      tags: generateTags(bookContent.theme, request.ageRange),
      theme: bookContent.theme,
      moralLesson: bookContent.moralLesson,
      pages: bookContent.pages.map(p => ({
        ...p,
        imageUrl: '',
        imageStoragePath: '',
      })),
      wordCount,
      pageCount: bookContent.pages.length,
      audio: createInitialAudioMetadata(),
      status: 'generating_images',
      version: 1,
      textHash,
    };

    // Save initial book to Firestore
    await db.collection('books').doc(bookId).set({
      ...initialBook,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Book document created: ${bookId}`);

    // Step 2: Generate images for all pages using Imagen
    console.log('Step 2: Generating images with Google Imagen...');
    const { coverImage, pageImages, failedPages } = await generateAllBookImages(
      bookId,
      bookContent.title,
      bookContent.synopsis,
      bookContent.theme,
      bookContent.pages.map(p => ({ pageNumber: p.pageNumber, imagePrompt: p.imagePrompt }))
    );

    // Update book with image URLs
    const updatedPages: BookPage[] = initialBook.pages.map(page => {
      const imageResult = pageImages.get(page.pageNumber);
      return {
        ...page,
        imageUrl: imageResult?.imageUrl || '',
        imageStoragePath: imageResult?.storagePath || '',
      };
    });

    await db.collection('books').doc(bookId).update({
      coverImageUrl: coverImage.imageUrl,
      coverImageStoragePath: coverImage.storagePath,
      pages: updatedPages,
      status: generateAudio ? 'generating_audio' : 'published',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Images generated: ${pageImages.size} succeeded, ${failedPages.length} failed`);

    let audioGenerated = false;

    // Step 3: Generate audio narration using Gemini TTS (if requested)
    if (generateAudio) {
      console.log('Step 3: Generating audio with Gemini TTS...');

      // Fetch updated book
      const bookDoc = await db.collection('books').doc(bookId).get();
      const book = { bookId, ...bookDoc.data() } as Book;

      const audioResult = await generateBookAudio(book, voiceName);
      audioGenerated = audioResult.success;

      // Update final status
      await db.collection('books').doc(bookId).update({
        status: audioResult.success ? 'published' : 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Audio generation ${audioResult.success ? 'succeeded' : 'failed'}`);
    }

    console.log(`Book generation complete: ${bookId}`);

    return {
      success: true,
      bookId,
      audioGenerated,
      imagesGenerated: pageImages.size,
    };

  } catch (error: any) {
    console.error(`Book generation failed for ${bookId}:`, error);

    // Update book status to failed
    try {
      await db.collection('books').doc(bookId).update({
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (updateError) {
      console.error('Failed to update book status:', updateError);
    }

    return {
      success: false,
      bookId,
      error: error.message || 'Book generation failed',
    };
  }
}

/**
 * Regenerate audio for an existing book
 */
export async function regenerateBookAudio(
  bookId: string,
  voiceName: GeminiVoice = 'Kore',
  force: boolean = false
): Promise<GenerationResult> {
  const db = admin.firestore();

  try {
    const bookDoc = await db.collection('books').doc(bookId).get();
    if (!bookDoc.exists) {
      return {
        success: false,
        bookId,
        error: 'Book not found',
      };
    }

    const book = { bookId, ...bookDoc.data() } as Book;

    const audioResult = await generateBookAudio(book, voiceName, force);

    return {
      success: audioResult.success,
      bookId,
      audioGenerated: audioResult.success,
      error: audioResult.error,
    };

  } catch (error: any) {
    console.error(`Audio regeneration failed for ${bookId}:`, error);
    return {
      success: false,
      bookId,
      error: error.message || 'Audio regeneration failed',
    };
  }
}

/**
 * Get reading level based on age range
 */
function getReadingLevel(ageRange: string): 'beginner' | 'intermediate' | 'advanced' {
  switch (ageRange) {
    case '3-5': return 'beginner';
    case '6-8': return 'intermediate';
    case '9-12': return 'advanced';
    default: return 'intermediate';
  }
}

/**
 * Generate tags for a book
 */
function generateTags(theme: string, ageRange: string): string[] {
  const tags = [
    theme,
    `ages-${ageRange}`,
    'kids',
    'storybook',
    'illustrated',
    'audio',
  ];

  // Add age-specific tags
  if (ageRange === '3-5') {
    tags.push('preschool', 'early-learning');
  } else if (ageRange === '6-8') {
    tags.push('early-reader', 'elementary');
  } else if (ageRange === '9-12') {
    tags.push('middle-grade', 'chapter-book');
  }

  return tags;
}

/**
 * Get book by ID
 */
export async function getBook(bookId: string): Promise<Book | null> {
  const db = admin.firestore();
  const doc = await db.collection('books').doc(bookId).get();

  if (!doc.exists) {
    return null;
  }

  return { bookId, ...doc.data() } as Book;
}

/**
 * List books with pagination and filters
 */
export async function listBooks(options: {
  ageRange?: string;
  status?: string;
  limit?: number;
  startAfter?: string;
}): Promise<Book[]> {
  const db = admin.firestore();
  let query: FirebaseFirestore.Query = db.collection('books');

  if (options.ageRange) {
    query = query.where('ageRange', '==', options.ageRange);
  }

  if (options.status) {
    query = query.where('status', '==', options.status);
  }

  query = query.orderBy('createdAt', 'desc');

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.startAfter) {
    const startDoc = await db.collection('books').doc(options.startAfter).get();
    if (startDoc.exists) {
      query = query.startAfter(startDoc);
    }
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ bookId: doc.id, ...doc.data() } as Book));
}

/**
 * Delete a book and its associated files
 */
export async function deleteBook(bookId: string): Promise<boolean> {
  const db = admin.firestore();
  const bucket = admin.storage().bucket();

  try {
    // Delete storage files
    const [files] = await bucket.getFiles({ prefix: `images/books/${bookId}/` });
    await Promise.all(files.map(file => file.delete().catch(() => {})));

    const [audioFiles] = await bucket.getFiles({ prefix: `audio/books/${bookId}/` });
    await Promise.all(audioFiles.map(file => file.delete().catch(() => {})));

    // Delete Firestore document
    await db.collection('books').doc(bookId).delete();

    console.log(`Book ${bookId} deleted successfully`);
    return true;

  } catch (error) {
    console.error(`Failed to delete book ${bookId}:`, error);
    return false;
  }
}
