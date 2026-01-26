/**
 * Anthropic Claude Service for Book Text Generation
 * Generates kid-friendly stories with 20 pages each
 */

import Anthropic from '@anthropic-ai/sdk';
import { BookPage, BookGenerationRequest, STORY_THEMES, CHARACTER_TYPES, SETTINGS } from '../types/book';
import * as functions from 'firebase-functions';

// Initialize Anthropic client with API key from environment
const getAnthropicClient = (): Anthropic => {
  const apiKey = process.env.ANTHROPIC_API_KEY || functions.config().anthropic?.api_key;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
};

interface GeneratedBookContent {
  title: string;
  author: string;
  synopsis: string;
  theme: string;
  moralLesson: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imagePrompt: string;
  }>;
}

/**
 * Generate a complete children's book with 20 pages
 */
export async function generateBookText(
  request: BookGenerationRequest,
  retryCount: number = 0
): Promise<GeneratedBookContent> {
  const maxRetries = 3;
  const client = getAnthropicClient();

  // Randomly select theme, character, setting if not provided
  const themes = STORY_THEMES[request.ageRange];
  const theme = request.theme || themes[Math.floor(Math.random() * themes.length)];
  const characterType = CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)];
  const setting = request.setting || SETTINGS[Math.floor(Math.random() * SETTINGS.length)];
  const moralLesson = request.moralLesson || getRandomMoralLesson(request.ageRange);

  const prompt = buildBookGenerationPrompt(request.ageRange, theme, characterType, setting, moralLesson);

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/```json\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : textContent.text;

    const bookData = JSON.parse(jsonStr) as GeneratedBookContent;

    // Validate the response
    if (!bookData.title || !bookData.pages || bookData.pages.length !== 20) {
      throw new Error(`Invalid book structure: expected 20 pages, got ${bookData.pages?.length || 0}`);
    }

    return {
      ...bookData,
      theme,
      moralLesson
    };

  } catch (error) {
    console.error(`Book generation error (attempt ${retryCount + 1}):`, error);

    if (retryCount < maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      await sleep(delay);
      return generateBookText(request, retryCount + 1);
    }

    throw error;
  }
}

function buildBookGenerationPrompt(
  ageRange: string,
  theme: string,
  characterType: string,
  setting: string,
  moralLesson: string
): string {
  const ageDescriptions: Record<string, string> = {
    '3-5': 'very young children (ages 3-5). Use simple words, short sentences (5-8 words), and repetition. Each page should have 2-3 simple sentences.',
    '6-8': 'early readers (ages 6-8). Use clear vocabulary, medium-length sentences (8-12 words), and engaging descriptions. Each page should have 3-4 sentences.',
    '9-12': 'confident readers (ages 9-12). Use rich vocabulary, varied sentence structures, and descriptive language. Each page should have a short paragraph (4-5 sentences).'
  };

  return `You are a world-class children's book author creating an ORIGINAL story. Generate a complete picture book with EXACTLY 20 pages.

TARGET AUDIENCE: ${ageDescriptions[ageRange] || ageDescriptions['6-8']}

STORY REQUIREMENTS:
- Theme: ${theme}
- Main character type: ${characterType}
- Setting: ${setting}
- Moral lesson: ${moralLesson}
- Must be 100% ORIGINAL (do not copy or reference existing books/characters)
- Content must be completely safe and age-appropriate
- No scary violence, death, or sensitive topics
- Include diverse characters and positive representation
- Story should have a clear beginning, middle, and satisfying end

IMAGE PROMPT REQUIREMENTS:
For each page, provide a detailed image prompt that describes:
- The scene composition and setting
- Character appearance and expressions
- Colors and lighting (vibrant, child-friendly colors)
- Art style: "colorful children's book illustration, digital art, warm and friendly, high quality"

OUTPUT FORMAT (strict JSON):
\`\`\`json
{
  "title": "The Story Title",
  "author": "AI Storybook Creator",
  "synopsis": "A 2-3 sentence summary of the story",
  "theme": "${theme}",
  "moralLesson": "${moralLesson}",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The story text for page 1...",
      "imagePrompt": "Detailed image description for page 1, colorful children's book illustration..."
    },
    // ... exactly 20 pages total
  ]
}
\`\`\`

Generate the complete book now. Ensure EXACTLY 20 pages, each with unique text and image prompt.`;
}

function getRandomMoralLesson(ageRange: string): string {
  const lessons: Record<string, string[]> = {
    '3-5': [
      'Sharing makes everyone happy',
      'Being kind to others feels good',
      'Trying new things is fun',
      'Everyone is special in their own way',
      'Family and friends love you',
      'Saying please and thank you matters',
      'Helping others is wonderful',
      'It\'s okay to make mistakes'
    ],
    '6-8': [
      'Courage means doing what\'s right even when scared',
      'True friends support each other',
      'Hard work leads to great things',
      'Everyone has unique talents',
      'Honesty builds trust',
      'Respecting differences makes the world better',
      'Never give up on your dreams',
      'Small acts of kindness make a big difference'
    ],
    '9-12': [
      'Standing up for what you believe in matters',
      'Learning from failures leads to success',
      'Empathy helps us understand others',
      'Taking responsibility shows maturity',
      'Creativity can solve any problem',
      'Working together achieves more than working alone',
      'Your choices shape who you become',
      'Everyone deserves respect and dignity'
    ]
  };

  const options = lessons[ageRange] || lessons['6-8'];
  return options[Math.floor(Math.random() * options.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { getAnthropicClient };
