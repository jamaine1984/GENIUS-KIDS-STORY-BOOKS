/**
 * Kids Storybook Library - Firebase Cloud Functions
 *
 * API Keys are stored in environment variables:
 * - ANTHROPIC_API_KEY: For text generation
 * - GEMINI_API_KEY: For image and audio generation
 */

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import {
  generateCompleteBook,
  regenerateBookAudio,
  getBook,
  listBooks,
  deleteBook
} from './services/bookService';
import { batchGenerateAudio } from './services/audioService';
import { BookGenerationRequest, GeminiVoice, GEMINI_VOICES } from './types/book';

// Initialize Firebase Admin
admin.initializeApp();

// Set runtime options for longer-running functions
const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 540, // 9 minutes
  memory: '1GB',
};

/**
 * Generate a complete book with text, images, and audio
 * Admin/script only - not exposed to client
 */
export const generateBook = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    // Verify admin/script authentication
    if (!context.auth?.token?.admin && !isServiceAccount(context)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can generate books'
      );
    }

    const request: BookGenerationRequest = {
      ageRange: data.ageRange || '6-8',
      theme: data.theme,
      characterName: data.characterName,
      setting: data.setting,
      moralLesson: data.moralLesson,
    };

    const generateAudio = data.generateAudio !== false;
    const voiceName: GeminiVoice = GEMINI_VOICES.includes(data.voiceName)
      ? data.voiceName
      : 'Kore';

    console.log(`generateBook called:`, {
      request,
      generateAudio,
      voiceName,
      caller: context.auth?.uid || 'service-account',
    });

    const result = await generateCompleteBook(request, generateAudio, voiceName);

    return result;
  });

/**
 * Generate or regenerate audio for an existing book
 * Admin/script only
 */
export const generateAudio = functions
  .runWith(runtimeOpts)
  .https.onCall(async (data, context) => {
    if (!context.auth?.token?.admin && !isServiceAccount(context)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can generate audio'
      );
    }

    const { bookId, voiceName, force } = data;

    if (!bookId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'bookId is required'
      );
    }

    const result = await regenerateBookAudio(
      bookId,
      GEMINI_VOICES.includes(voiceName) ? voiceName : 'Kore',
      force === true
    );

    return result;
  });

/**
 * Batch generate audio for multiple books
 * Admin/script only
 */
export const batchGenerateBookAudio = functions
  .runWith({ ...runtimeOpts, timeoutSeconds: 540 })
  .https.onCall(async (data, context) => {
    if (!context.auth?.token?.admin && !isServiceAccount(context)) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can batch generate audio'
      );
    }

    const { bookIds, voiceName, maxConcurrency } = data;

    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'bookIds array is required'
      );
    }

    const result = await batchGenerateAudio(
      bookIds,
      GEMINI_VOICES.includes(voiceName) ? voiceName : 'Kore',
      maxConcurrency || 2
    );

    return result;
  });

/**
 * Get a book by ID - Client accessible
 */
export const fetchBook = functions.https.onCall(async (data, context) => {
  const { bookId } = data;

  if (!bookId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'bookId is required'
    );
  }

  const book = await getBook(bookId);

  if (!book) {
    throw new functions.https.HttpsError('not-found', 'Book not found');
  }

  // Only return published books to clients (unless admin)
  if (book.status !== 'published' && !context.auth?.token?.admin) {
    throw new functions.https.HttpsError('not-found', 'Book not found');
  }

  return book;
});

/**
 * List books with filters - Client accessible
 */
export const fetchBooks = functions.https.onCall(async (data, context) => {
  const { ageRange, limit, startAfter } = data;

  // Clients can only see published books
  const status = context.auth?.token?.admin ? data.status : 'published';

  const books = await listBooks({
    ageRange,
    status,
    limit: Math.min(limit || 20, 100),
    startAfter,
  });

  return books;
});

/**
 * Delete a book - Admin only
 */
export const removeBook = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can delete books'
    );
  }

  const { bookId } = data;

  if (!bookId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'bookId is required'
    );
  }

  const success = await deleteBook(bookId);

  return { success, bookId };
});

/**
 * Get batch generation progress
 */
export const getBatchProgress = functions.https.onCall(async (data, context) => {
  if (!context.auth?.token?.admin && !isServiceAccount(context)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can view batch progress'
    );
  }

  const { batchId } = data;

  if (!batchId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'batchId is required'
    );
  }

  const doc = await admin.firestore()
    .collection('batchProgress')
    .doc(batchId)
    .get();

  if (!doc.exists) {
    throw new functions.https.HttpsError('not-found', 'Batch not found');
  }

  return doc.data();
});

/**
 * Health check endpoint
 */
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * Check if the caller is a service account (for batch scripts)
 */
function isServiceAccount(context: functions.https.CallableContext): boolean {
  // Service accounts have specific token claims
  const token = context.auth?.token;
  if (!token) return false;

  // Check for service account email pattern
  const email = token.email || '';
  return email.endsWith('.iam.gserviceaccount.com');
}

// Export types for client use
export * from './types/book';
