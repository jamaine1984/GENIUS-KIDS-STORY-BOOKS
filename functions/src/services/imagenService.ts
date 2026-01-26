/**
 * Google Imagen Service for Image Generation
 * Generates colorful illustrations for each page of the storybook
 */

import { GoogleGenAI } from '@google/genai';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Google GenAI client
const getImagenClient = (): GoogleGenAI => {
  const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }
  return new GoogleGenAI({ apiKey });
};

interface ImageGenerationResult {
  imageUrl: string;
  storagePath: string;
}

/**
 * Generate an image using Google Imagen and upload to Firebase Storage
 */
export async function generateImage(
  imagePrompt: string,
  bookId: string,
  pageNumber: number,
  retryCount: number = 0
): Promise<ImageGenerationResult> {
  const maxRetries = 3;
  const client = getImagenClient();
  const bucket = admin.storage().bucket();

  // Enhance prompt for child-friendly, colorful output
  const enhancedPrompt = enhanceImagePrompt(imagePrompt);

  try {
    console.log(`Generating image for book ${bookId}, page ${pageNumber}`);

    const response = await client.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: enhancedPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '4:3', // Good for storybook pages
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No images generated');
    }

    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (!imageBytes) {
      throw new Error('No image bytes in response');
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBytes, 'base64');

    // Upload to Firebase Storage
    const storagePath = `images/books/${bookId}/page_${String(pageNumber).padStart(2, '0')}.png`;
    const file = bucket.file(storagePath);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000', // 1 year cache
        metadata: {
          bookId,
          pageNumber: String(pageNumber),
          generatedAt: new Date().toISOString(),
        },
      },
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log(`Image uploaded successfully: ${storagePath}`);

    return {
      imageUrl: publicUrl,
      storagePath,
    };

  } catch (error: any) {
    console.error(`Image generation error (attempt ${retryCount + 1}):`, error);

    // Check for rate limiting
    if (error.status === 429 || error.message?.includes('429')) {
      const delay = Math.pow(2, retryCount + 1) * 2000; // Longer delay for rate limits
      console.log(`Rate limited, waiting ${delay}ms before retry`);
      await sleep(delay);
    }

    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      await sleep(delay);
      return generateImage(imagePrompt, bookId, pageNumber, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Generate cover image for the book
 */
export async function generateCoverImage(
  title: string,
  synopsis: string,
  theme: string,
  bookId: string,
  retryCount: number = 0
): Promise<ImageGenerationResult> {
  const maxRetries = 3;
  const client = getImagenClient();
  const bucket = admin.storage().bucket();

  const coverPrompt = `Children's book cover illustration for "${title}". ${synopsis}. Theme: ${theme}.
Style: Vibrant, colorful, whimsical children's book cover art, professional quality,
eye-catching design, warm and inviting colors, suitable for young children,
digital illustration, high detail, magical atmosphere.`;

  try {
    console.log(`Generating cover image for book ${bookId}`);

    const response = await client.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: coverPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '3:4', // Portrait for book cover
      },
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
      throw new Error('No cover image generated');
    }

    const imageBytes = response.generatedImages[0].image?.imageBytes;
    if (!imageBytes) {
      throw new Error('No image bytes in response');
    }

    const imageBuffer = Buffer.from(imageBytes, 'base64');
    const storagePath = `images/books/${bookId}/cover.png`;
    const file = bucket.file(storagePath);

    await file.save(imageBuffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
        metadata: {
          bookId,
          type: 'cover',
          generatedAt: new Date().toISOString(),
        },
      },
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log(`Cover image uploaded: ${storagePath}`);

    return {
      imageUrl: publicUrl,
      storagePath,
    };

  } catch (error: any) {
    console.error(`Cover image generation error (attempt ${retryCount + 1}):`, error);

    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000;
      await sleep(delay);
      return generateCoverImage(title, synopsis, theme, bookId, retryCount + 1);
    }

    throw error;
  }
}

/**
 * Generate all images for a book (cover + 20 pages) with concurrency control
 */
export async function generateAllBookImages(
  bookId: string,
  title: string,
  synopsis: string,
  theme: string,
  pages: Array<{ pageNumber: number; imagePrompt: string }>,
  maxConcurrency: number = 2
): Promise<{
  coverImage: ImageGenerationResult;
  pageImages: Map<number, ImageGenerationResult>;
  failedPages: number[];
}> {
  console.log(`Starting image generation for book ${bookId}: cover + ${pages.length} pages`);

  const pageImages = new Map<number, ImageGenerationResult>();
  const failedPages: number[] = [];

  // Generate cover first
  const coverImage = await generateCoverImage(title, synopsis, theme, bookId);

  // Generate page images with concurrency limit
  const chunks: Array<Array<{ pageNumber: number; imagePrompt: string }>> = [];
  for (let i = 0; i < pages.length; i += maxConcurrency) {
    chunks.push(pages.slice(i, i + maxConcurrency));
  }

  for (const chunk of chunks) {
    const results = await Promise.allSettled(
      chunk.map(page => generateImage(page.imagePrompt, bookId, page.pageNumber))
    );

    results.forEach((result, index) => {
      const pageNumber = chunk[index].pageNumber;
      if (result.status === 'fulfilled') {
        pageImages.set(pageNumber, result.value);
      } else {
        console.error(`Failed to generate image for page ${pageNumber}:`, result.reason);
        failedPages.push(pageNumber);
      }
    });

    // Small delay between chunks to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await sleep(500);
    }
  }

  console.log(`Image generation complete for book ${bookId}: ${pageImages.size} succeeded, ${failedPages.length} failed`);

  return { coverImage, pageImages, failedPages };
}

function enhanceImagePrompt(originalPrompt: string): string {
  // Add child-friendly art style specifications if not already present
  const styleKeywords = [
    'children\'s book illustration',
    'colorful',
    'child-friendly',
    'vibrant',
    'digital art'
  ];

  let prompt = originalPrompt;

  // Check if style keywords are missing
  const hasStyleKeywords = styleKeywords.some(keyword =>
    prompt.toLowerCase().includes(keyword.toLowerCase())
  );

  if (!hasStyleKeywords) {
    prompt += '. Style: Colorful children\'s book illustration, digital art, vibrant colors, warm and friendly, whimsical, high quality, suitable for young children.';
  }

  // Add safety specifications
  prompt += ' Safe for children, no scary elements, positive and joyful atmosphere.';

  return prompt;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { getImagenClient };
