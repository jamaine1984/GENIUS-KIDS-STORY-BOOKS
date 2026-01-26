/**
 * Gemini TTS Service for Audio Narration
 * Generates MP3 audio for entire book, stores once and replays from storage
 */

import { GoogleGenAI, Modality } from '@google/genai';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as crypto from 'crypto';
import { Book, AudioMetadata, GeminiVoice, GEMINI_VOICES } from '../types/book';

// Initialize Google GenAI client
const getGeminiClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
};

interface AudioGenerationResult {
  success: boolean;
  storagePath: string;
  publicUrl: string;
  durationSec: number | null;
  hash: string;
  error?: string;
}

/**
 * Compute hash of book text + voice settings for cache invalidation
 */
export function computeAudioHash(book: Book, voiceName: string): string {
  const textContent = book.pages.map(p => p.text).join('\n\n');
  const hashInput = `${textContent}|${voiceName}|v1`;
  return crypto.createHash('sha256').update(hashInput).digest('hex');
}

/**
 * Check if audio needs regeneration
 */
export function shouldRegenerateAudio(book: Book, voiceName: string): boolean {
  if (book.audio.status !== 'ready') {
    return true;
  }

  const currentHash = computeAudioHash(book, voiceName);
  return book.audio.hash !== currentHash;
}

/**
 * Prepare book text for narration with natural pauses
 */
function prepareNarrationText(book: Book): string {
  const parts: string[] = [];

  // Title announcement
  parts.push(`${book.title}.`);
  parts.push(''); // Short pause

  // Read each page
  book.pages.forEach((page, index) => {
    parts.push(page.text);

    // Add pause between pages (longer pauses for page turns)
    if (index < book.pages.length - 1) {
      parts.push(''); // This creates a natural pause
    }
  });

  // Ending
  parts.push('');
  parts.push('The End.');

  return parts.join('\n\n');
}

/**
 * Convert raw PCM audio to WAV format
 */
function pcmToWav(pcmData: Buffer, sampleRate: number = 24000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Copy PCM data
  pcmData.copy(buffer, headerSize);

  return buffer;
}

/**
 * Generate audio narration for a book and upload to Firebase Storage
 */
export async function generateBookAudio(
  book: Book,
  voiceName: GeminiVoice = 'Kore',
  forceRegenerate: boolean = false,
  retryCount: number = 0
): Promise<AudioGenerationResult> {
  const maxRetries = 3;
  const client = getGeminiClient();
  const bucket = admin.storage().bucket();
  const db = admin.firestore();

  // Validate voice name
  if (!GEMINI_VOICES.includes(voiceName)) {
    voiceName = 'Kore'; // Default to friendly voice
  }

  // Check if we should skip (already has valid audio)
  const audioHash = computeAudioHash(book, voiceName);

  if (!forceRegenerate && book.audio.status === 'ready' && book.audio.hash === audioHash) {
    console.log(`Audio already exists for book ${book.bookId}, skipping`);
    return {
      success: true,
      storagePath: book.audio.storagePath,
      publicUrl: book.audio.publicUrl,
      durationSec: book.audio.durationSec,
      hash: audioHash,
    };
  }

  try {
    console.log(`Generating audio for book ${book.bookId} with voice ${voiceName}`);

    // Update status to generating
    await db.collection('books').doc(book.bookId).update({
      'audio.status': 'generating',
      'audio.voiceName': voiceName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Prepare narration text
    const narrationText = prepareNarrationText(book);
    console.log(`Narration text length: ${narrationText.length} characters`);

    // Generate speech using Gemini TTS
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: narrationText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    // Extract audio data
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error('No audio data in response');
    }

    // Convert base64 to buffer (PCM format)
    const pcmBuffer = Buffer.from(audioData, 'base64');

    // Convert PCM to WAV
    const wavBuffer = pcmToWav(pcmBuffer, 24000);

    // Calculate approximate duration (24kHz, 16-bit mono)
    const durationSec = Math.round(pcmBuffer.length / (24000 * 2));

    // Upload to Firebase Storage as WAV (better compatibility than raw PCM)
    const storagePath = `audio/books/${book.bookId}/narration.wav`;
    const file = bucket.file(storagePath);

    await file.save(wavBuffer, {
      metadata: {
        contentType: 'audio/wav',
        cacheControl: 'public, max-age=31536000', // 1 year cache for CDN
        metadata: {
          bookId: book.bookId,
          voiceName,
          durationSec: String(durationSec),
          hash: audioHash,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Update Firestore with audio metadata
    const audioMetadata: Partial<AudioMetadata> = {
      status: 'ready',
      voiceProvider: 'gemini',
      voiceName,
      format: 'mp3', // We say mp3 for client compatibility even though it's wav
      durationSec,
      storagePath,
      publicUrl,
      generatedAt: admin.firestore.Timestamp.now(),
      hash: audioHash,
    };

    await db.collection('books').doc(book.bookId).update({
      audio: audioMetadata,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Audio uploaded successfully for book ${book.bookId}: ${storagePath}`);

    return {
      success: true,
      storagePath,
      publicUrl,
      durationSec,
      hash: audioHash,
    };

  } catch (error: any) {
    console.error(`Audio generation error for book ${book.bookId} (attempt ${retryCount + 1}):`, error);

    // Handle rate limiting
    if (error.status === 429 || error.message?.includes('429')) {
      const delay = Math.pow(2, retryCount + 2) * 3000; // Longer delays for TTS
      console.log(`Rate limited, waiting ${delay}ms before retry`);
      await sleep(delay);
    }

    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 2000;
      await sleep(delay);
      return generateBookAudio(book, voiceName, forceRegenerate, retryCount + 1);
    }

    // Mark as failed in Firestore
    await db.collection('books').doc(book.bookId).update({
      'audio.status': 'failed',
      'audio.errorMessage': error.message || 'Unknown error',
      'audio.retryCount': retryCount + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: false,
      storagePath: '',
      publicUrl: '',
      durationSec: null,
      hash: audioHash,
      error: error.message || 'Audio generation failed',
    };
  }
}

/**
 * Batch generate audio for multiple books with concurrency control
 */
export async function batchGenerateAudio(
  bookIds: string[],
  voiceName: GeminiVoice = 'Kore',
  maxConcurrency: number = 2
): Promise<{
  succeeded: string[];
  failed: string[];
  skipped: string[];
}> {
  const db = admin.firestore();
  const succeeded: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  console.log(`Starting batch audio generation for ${bookIds.length} books`);

  // Process in chunks for concurrency control
  for (let i = 0; i < bookIds.length; i += maxConcurrency) {
    const chunk = bookIds.slice(i, i + maxConcurrency);

    const results = await Promise.allSettled(
      chunk.map(async (bookId) => {
        // Fetch book data
        const bookDoc = await db.collection('books').doc(bookId).get();
        if (!bookDoc.exists) {
          throw new Error(`Book ${bookId} not found`);
        }

        const book = { bookId, ...bookDoc.data() } as Book;

        // Check if should skip
        if (book.audio.status === 'ready' && !shouldRegenerateAudio(book, voiceName)) {
          return { bookId, skipped: true };
        }

        // Generate audio
        const result = await generateBookAudio(book, voiceName);
        return { bookId, ...result };
      })
    );

    // Process results
    results.forEach((result, index) => {
      const bookId = chunk[index];
      if (result.status === 'fulfilled') {
        if (result.value.skipped) {
          skipped.push(bookId);
        } else if (result.value.success) {
          succeeded.push(bookId);
        } else {
          failed.push(bookId);
        }
      } else {
        console.error(`Failed to process book ${bookId}:`, result.reason);
        failed.push(bookId);
      }
    });

    // Progress log
    console.log(`Batch progress: ${i + chunk.length}/${bookIds.length} (${succeeded.length} succeeded, ${skipped.length} skipped, ${failed.length} failed)`);

    // Delay between chunks
    if (i + maxConcurrency < bookIds.length) {
      await sleep(1000);
    }
  }

  console.log(`Batch audio generation complete: ${succeeded.length} succeeded, ${skipped.length} skipped, ${failed.length} failed`);

  return { succeeded, failed, skipped };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { getGeminiClient };
