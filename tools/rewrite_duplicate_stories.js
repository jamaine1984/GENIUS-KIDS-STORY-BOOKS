/**
 * Rewrite duplicate stories with unique, creative content
 * Keeps all existing images but regenerates text and audio
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'genius-kids-story-books.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Google AI
const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Text-to-Speech client
const ttsClient = new textToSpeech.TextToSpeechClient();

// Books that need rewriting (from analysis)
const BOOKS_TO_REWRITE = [
  'baby-bird-flies', 'busy-bee', 'dancing-leaves', 'happy-puppy', 'hop-hop-bunny',
  'little-cloud-s-big-day', 'rainy-day-fun', 'shiny-stars', 'sleepy-kitten', 'snowy-day',
  'beyond-the-northern-lights', 'champions-of-change', 'dragon-s-best-friend',
  'guardian-of-the-garden', 'journey-to-star-mountain', 'mystery-of-the-missing-moon',
  'planet-of-the-lost-toys', 'rescue-at-rainbow-falls', 'shadows-and-light',
  'the-day-dreams-came-true', 'the-flying-bicycle', 'the-invisible-helper',
  'the-memory-keeper', 'the-orchestra-of-one', 'the-puzzle-master', 'the-robot-who-felt',
  'the-time-traveling-treehouse', 'the-underwater-kingdom', 'the-whispering-woods',
  'when-giants-were-small', 'brave-little-firefly', 'calm-cat', 'creative-caterpillar',
  'curious-kit-the-fox', 'flexible-flamingo', 'lily-s-garden-of-feelings',
  'max-and-the-magic-words', 'penny-the-patient-penguin', 'responsible-robin',
  'strong-sophie-squirrel', 'team-turtle', 'the-forgiving-frog', 'the-friendship-bridge',
  'the-helper-hedgehog', 'the-honest-hippo', 'the-listening-owl', 'the-respectful-raccoon',
  'the-sharing-tree', 'the-thankful-tortoise', 'zoe-s-quiet-superpower',
  'builders-of-bridge-city', 'echoes-of-tomorrow', 'island-of-second-chances',
  'the-compass-of-truth', 'the-empathy-engine', 'the-quantum-quest',
  'the-weight-of-words', 'voices-unheard'
];

// Generate unique story
async function generateUniqueStory(title, theme, ageRange, pageCount, moralLesson) {
  const ageGuidelines = {
    '0-2': 'Very simple, repetitive language. One sentence per page. Focus on sounds, actions, and familiar objects. 15-25 words per page.',
    '3-5': 'Simple sentences with some descriptive words. 2-3 sentences per page. Clear narrative with a beginning, middle, end. 40-60 words per page.',
    '6-8': 'More complex sentences and vocabulary. 3-4 sentences per page. Engaging plot with character development. 70-90 words per page.',
    '9-10': 'Sophisticated language and storytelling. 4-5 sentences per page. Deep themes and character arcs. 90-110 words per page.'
  };

  const prompt = `Create a completely unique and creative children's story for "${title}".

Theme: ${theme}
Age Range: ${ageRange}
Moral Lesson: ${moralLesson}
Number of Pages: ${pageCount}

${ageGuidelines[ageRange]}

CRITICAL: This story must be COMPLETELY DIFFERENT from all other stories. Be highly creative and original. Each page should advance the plot in a meaningful way.

Return ONLY valid JSON with this structure (no markdown, no code blocks):
{
  "pages": [
    {
      "pageNumber": 1,
      "text": "page text here"
    }
  ]
}`;

  const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro-latest" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  let text = response.text();

  // Clean up response
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  return JSON.parse(text);
}

// Generate audio
async function generateAudio(text, voiceSpeed) {
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-F',
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: voiceSpeed
    }
  };

  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

// Upload audio to storage
async function uploadAudio(audioContent, filePath) {
  const file = bucket.file(filePath);
  await file.save(Buffer.from(audioContent), {
    metadata: { contentType: 'audio/mpeg' },
    public: true
  });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function rewriteStories() {
  console.log('\n✍️  STORY REWRITE TOOL');
  console.log('='.repeat(70));
  console.log(`\n📚 Rewriting ${BOOKS_TO_REWRITE.length} books with unique stories\n`);

  const voiceSpeeds = { '0-2': 0.80, '3-5': 0.85, '6-8': 0.88, '9-10': 0.90 };

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < BOOKS_TO_REWRITE.length; i++) {
    const bookId = BOOKS_TO_REWRITE[i];
    console.log(`[${i + 1}/${BOOKS_TO_REWRITE.length}] Processing: ${bookId}`);

    try {
      // Get existing book
      const bookDoc = await db.collection('books').doc(bookId).get();
      if (!bookDoc.exists) {
        console.log(`   ⚠️  Book not found, skipping`);
        failed++;
        continue;
      }

      const book = bookDoc.data();
      const pageCount = book.pages ? book.pages.length : 8;

      console.log(`   📖 ${book.title} (${book.ageRange}) - ${pageCount} pages`);

      // Generate new unique story
      console.log(`   ✍️  Generating unique story...`);
      const newStory = await generateUniqueStory(
        book.title,
        book.theme,
        book.ageRange,
        pageCount,
        book.moralLesson
      );

      // Keep existing images, update text and regenerate audio
      const updatedPages = [];
      for (let j = 0; j < book.pages.length; j++) {
        const oldPage = book.pages[j];
        const newPage = newStory.pages[j];

        console.log(`   🎙️  Page ${j + 1}: Generating audio...`);
        const audioContent = await generateAudio(newPage.text, voiceSpeeds[book.ageRange]);
        const audioPath = `books/${bookId}/page_${j + 1}_audio.mp3`;
        const audioUrl = await uploadAudio(audioContent, audioPath);

        updatedPages.push({
          pageNumber: j + 1,
          text: newPage.text,
          imageUrl: oldPage.imageUrl, // Keep existing image
          imageStoragePath: oldPage.imageStoragePath, // Keep existing image
          audioUrl: audioUrl
        });

        await sleep(2000); // Rate limiting
      }

      // Update Firestore
      await db.collection('books').doc(bookId).update({
        pages: updatedPages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`   ✅ Story rewritten and audio regenerated!\n`);
      completed++;

      // Progress update every 5 books
      if ((i + 1) % 5 === 0) {
        console.log(`📊 Progress: ${i + 1}/${BOOKS_TO_REWRITE.length} | ✅ ${completed} | ❌ ${failed}\n`);
      }

      await sleep(3000); // Rate limiting between books

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failed++;
    }
  }

  console.log('='.repeat(70));
  console.log('🎉 STORY REWRITE COMPLETE!');
  console.log(`✅ Completed: ${completed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(70) + '\n');

  process.exit(0);
}

rewriteStories().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
