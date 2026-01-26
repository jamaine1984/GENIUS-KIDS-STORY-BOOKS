/**
 * Kids Storybook Library - Type Definitions
 * Complete data model for books, pages, audio, and images
 */

export interface BookPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl: string;
  imageStoragePath: string;
}

export interface AudioMetadata {
  status: 'missing' | 'generating' | 'ready' | 'failed';
  voiceProvider: 'gemini';
  voiceName: string;
  format: 'mp3';
  durationSec: number | null;
  storagePath: string;
  publicUrl: string;
  generatedAt: FirebaseFirestore.Timestamp | null;
  hash: string;
  errorMessage?: string;
  retryCount?: number;
}

export interface Book {
  bookId: string;
  title: string;
  author: string;
  coverImageUrl: string;
  coverImageStoragePath: string;
  synopsis: string;
  ageRange: '3-5' | '6-8' | '9-12';
  readingLevel: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  theme: string;
  moralLesson: string;
  pages: BookPage[];
  wordCount: number;
  pageCount: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  audio: AudioMetadata;
  status: 'draft' | 'generating_images' | 'generating_audio' | 'published' | 'failed';
  version: number;
  textHash: string;
}

export interface BookGenerationRequest {
  ageRange: '3-5' | '6-8' | '9-12';
  theme?: string;
  characterName?: string;
  setting?: string;
  moralLesson?: string;
}

export interface AudioGenerationRequest {
  bookId: string;
  voiceName?: string;
  forceRegenerate?: boolean;
}

export interface BatchGenerationProgress {
  batchId: string;
  totalBooks: number;
  completedBooks: number;
  failedBooks: number;
  skippedBooks: number;
  startedAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  status: 'running' | 'completed' | 'failed' | 'paused';
  currentBookId: string | null;
  errors: Array<{
    bookId: string;
    error: string;
    timestamp: FirebaseFirestore.Timestamp;
  }>;
}

export interface GenerationResult {
  success: boolean;
  bookId?: string;
  error?: string;
  audioGenerated?: boolean;
  imagesGenerated?: number;
}

// Voice options for Gemini TTS
export const GEMINI_VOICES = [
  'Aoede',
  'Charon',
  'Fenrir',
  'Kore',
  'Puck',
  'Zephyr'
] as const;

export type GeminiVoice = typeof GEMINI_VOICES[number];

// Age-appropriate themes for story generation
export const STORY_THEMES = {
  '3-5': [
    'friendship', 'sharing', 'colors', 'animals', 'family',
    'bedtime', 'nature', 'kindness', 'counting', 'seasons'
  ],
  '6-8': [
    'adventure', 'courage', 'teamwork', 'discovery', 'helping others',
    'imagination', 'problem solving', 'science', 'space', 'ocean'
  ],
  '9-12': [
    'perseverance', 'leadership', 'empathy', 'environment', 'history',
    'technology', 'creativity', 'responsibility', 'diversity', 'dreams'
  ]
} as const;

export const CHARACTER_TYPES = [
  'child', 'animal', 'magical creature', 'robot', 'fairy',
  'dragon', 'superhero', 'princess', 'explorer', 'scientist'
] as const;

export const SETTINGS = [
  'enchanted forest', 'underwater kingdom', 'space station', 'magical garden',
  'cozy village', 'jungle adventure', 'arctic wonderland', 'candy land',
  'dinosaur world', 'cloud city', 'treehouse', 'pirate ship'
] as const;
