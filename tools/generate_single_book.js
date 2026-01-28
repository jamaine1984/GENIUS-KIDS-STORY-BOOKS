/**
 * Single Book Generator - Test with slower voice and more content
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'genius-kids-story-books.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Google AI API Key
const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Voice settings - SLOWER SPEED for kids
const VOICE_CONFIG = {
  name: 'en-US-Studio-O',  // Warm, friendly female voice
  speakingRate: 0.85,      // Slower than normal (1.0) for kids to follow
  pitch: 0.0,              // Natural pitch
  volumeGainDb: 0.0
};

// ============================================
// NEW TEST BOOK: Ages 3-5 - "Luna and the Magic Garden"
// More content per page, engaging story
// ============================================
const testBook = {
  title: "Luna and the Magic Garden",
  ageRange: "3-5",
  theme: "nature",
  moralLesson: "Taking care of nature helps everyone grow",
  synopsis: "A curious little girl named Luna discovers a magical garden where flowers sing, vegetables dance, and she learns the joy of helping things grow.",
  pages: [
    {
      pageNumber: 1,
      text: "Luna was a little girl with curly brown hair and the biggest, brightest smile you ever did see. She lived in a cozy yellow house with her grandmother, who everyone called Nana. One sunny morning, Luna woke up extra early. The birds were singing outside her window, and she knew today was going to be a very special day.",
      imagePrompt: "Adorable little girl with curly brown hair waking up in a cozy bedroom, sunlight streaming through window, birds on windowsill, cheerful morning scene, children's book illustration style, warm colors, digital art"
    },
    {
      pageNumber: 2,
      text: "Luna ran downstairs in her favorite purple pajamas. Nana was in the kitchen making pancakes that smelled like heaven. 'Good morning, my little sunshine!' said Nana with a warm hug. 'Today I have a surprise for you. There is a secret place in our backyard that I want to show you.' Luna's eyes grew wide with excitement. A secret place? She could hardly wait!",
      imagePrompt: "Grandmother hugging little girl in cozy kitchen, pancakes on stove, warm morning light, loving family scene, children's book illustration style, heartwarming, digital art"
    },
    {
      pageNumber: 3,
      text: "After breakfast, Nana took Luna's hand and led her through the backyard. They walked past the old oak tree, past the swing set, and through a little wooden gate that Luna had never noticed before. Behind the gate was the most amazing garden Luna had ever seen! There were flowers of every color - red, orange, yellow, pink, and purple. Butterflies danced in the air, and the whole place seemed to sparkle.",
      imagePrompt: "Little girl and grandmother walking through magical garden gate, enchanted garden with colorful flowers everywhere, butterflies, sparkles in the air, wonder and amazement, children's book illustration style, vibrant colors, digital art"
    },
    {
      pageNumber: 4,
      text: "But wait - did that sunflower just wave at her? Luna rubbed her eyes and looked again. The tall yellow sunflower was definitely waving! 'Hello there, little one!' said the sunflower in a cheerful voice. 'Welcome to the Magic Garden!' Luna couldn't believe her ears. The flowers could talk! A red rose nearby giggled, and a group of daisies started doing a little dance.",
      imagePrompt: "Friendly talking sunflower waving at amazed little girl, roses giggling, daisies dancing, magical garden scene, expressive flower characters with faces, children's book illustration style, whimsical and enchanting, digital art"
    },
    {
      pageNumber: 5,
      text: "Nana smiled and knelt down beside Luna. 'This garden is very special,' she explained. 'But it needs someone to take care of it. The flowers need water. The vegetables need love. And everything needs a friend.' Luna looked around at all the happy plants and knew exactly what she wanted to do. 'I want to help!' she said. 'I want to be the garden's friend!'",
      imagePrompt: "Grandmother kneeling beside little girl explaining about the garden, magical plants listening happily in background, tender teaching moment, children's book illustration style, warm and educational, digital art"
    },
    {
      pageNumber: 6,
      text: "The sunflower clapped its leaves together with joy! Nana gave Luna a small green watering can with a rainbow on it. 'This is your very own watering can,' said Nana. 'When you water the plants with love in your heart, magical things happen.' Luna carefully filled her watering can and walked over to a little tomato plant that looked very thirsty. Its leaves were droopy and sad.",
      imagePrompt: "Little girl receiving special rainbow watering can from grandmother, droopy sad tomato plant nearby, garden setting, gift-giving moment, children's book illustration style, sweet and meaningful, digital art"
    },
    {
      pageNumber: 7,
      text: "Luna gently poured water on the tomato plant and whispered, 'Grow strong, little tomato. I believe in you!' Something amazing happened! The tomato plant stood up tall and proud. Its leaves turned bright green, and three shiny red tomatoes appeared right before Luna's eyes! 'Thank you, Luna!' said the tomato plant. 'That was the best drink of water I ever had!'",
      imagePrompt: "Little girl watering tomato plant with rainbow watering can, plant magically growing tall with bright red tomatoes appearing, sparkles and magic effects, transformation scene, children's book illustration style, wonder and magic, digital art"
    },
    {
      pageNumber: 8,
      text: "Luna spent the whole morning helping in the Magic Garden. She watered the carrots, and they did a happy wiggle dance. She sang a song to the strawberries, and they turned the sweetest shade of red. She even told a funny joke to the broccoli, and it laughed so hard its little green florets shook! Every plant Luna helped grew stronger and happier.",
      imagePrompt: "Montage of little girl helping various vegetables - dancing carrots, red strawberries, laughing broccoli, all plants happy and animated, busy garden helper scene, children's book illustration style, joyful and playful, digital art"
    },
    {
      pageNumber: 9,
      text: "As the sun started to set, painting the sky orange and pink, all the plants gathered around Luna. The sunflower spoke up, 'Luna, you have shown us so much kindness today. You watered us, you talked to us, and you made us feel loved. That is the most important thing anyone can do.' The flowers all nodded their petals in agreement.",
      imagePrompt: "Sunset scene in magical garden, all plants gathered around little girl, sunflower speaking, beautiful orange and pink sky, grateful plants, heartwarming community moment, children's book illustration style, emotional and beautiful, digital art"
    },
    {
      pageNumber: 10,
      text: "Nana came to bring Luna inside for dinner. But before they left, all the plants gave Luna a special gift - a tiny seed that glowed with golden light. 'Plant this seed,' said the sunflower, 'and you will always have a piece of the Magic Garden with you.' Luna held the seed close to her heart. She knew she had found the best friends in the whole world.",
      imagePrompt: "Plants presenting glowing golden seed to little girl, grandmother watching proudly, magical moment of gift-giving, all plants happy and grateful, golden glow effect, children's book illustration style, magical and touching, digital art"
    },
    {
      pageNumber: 11,
      text: "That night, Luna planted her special seed in a little pot by her window. She watered it gently and whispered goodnight. As she climbed into bed, she could swear she heard a tiny voice say, 'Thank you, Luna!' She smiled the biggest smile and closed her eyes. Luna dreamed of dancing carrots, singing flowers, and all the wonderful adventures waiting for her in the Magic Garden.",
      imagePrompt: "Little girl in bed smiling, small pot with planted seed on windowsill glowing softly, moonlight through window, dreamy peaceful scene, thought bubble showing dancing vegetables and flowers, children's book illustration style, cozy bedtime scene, digital art"
    },
    {
      pageNumber: 12,
      text: "The End. Remember, just like Luna learned, when we take care of nature and treat every living thing with kindness, magical things can happen. Plants give us food to eat, flowers make the world beautiful, and gardens give homes to butterflies and bees. You can be a garden helper too! Water a plant, pick up litter, or simply say hello to a flower. The magic is in your hands!",
      imagePrompt: "Final page illustration showing Luna happily tending garden with all her plant friends, butterflies, bees, grandmother watching proudly, beautiful sunny day, message of hope and nature, children's book illustration style, bright and inspiring, digital art"
    }
  ]
};

// Generate image using Gemini
async function generateImage(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  Generating image (attempt ${attempt})...`);

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Generate a beautiful, child-friendly illustration: ${prompt}.
                   Style: Bright, colorful, safe for children, no scary elements.
                   The image should be warm, inviting, and perfect for a children's storybook.`
          }]
        }],
        generationConfig: {
          responseModalities: ['image', 'text'],
        }
      });

      const response = await result.response;

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
        }
      }

      throw new Error('No image in response');
    } catch (error) {
      console.log(`  Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        return null;
      }
      await sleep(2000 * attempt);
    }
  }
  return null;
}

// Generate audio using Google Cloud TTS - SLOWER SPEED
async function generateAudio(text, voiceConfig) {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      input: { text: text },
      voice: {
        languageCode: 'en-US',
        name: voiceConfig.name,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: voiceConfig.speakingRate,  // SLOWER for kids
        pitch: voiceConfig.pitch,
        volumeGainDb: voiceConfig.volumeGainDb
      }
    });

    const options = {
      hostname: 'texttospeech.googleapis.com',
      path: `/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const response = JSON.parse(data);
          resolve(response.audioContent);
        } else {
          reject(new Error(`TTS API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(requestData);
    req.end();
  });
}

// Upload to Firebase Storage
async function uploadToStorage(data, filePath, contentType) {
  const buffer = Buffer.from(data, 'base64');
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: { contentType },
    public: true
  });

  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Main generation function
async function generateBook() {
  const book = testBook;
  const bookId = slugify(book.title);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Generating: ${book.title}`);
  console.log(`Age Range: ${book.ageRange}`);
  console.log(`Pages: ${book.pages.length}`);
  console.log(`Voice Speed: ${VOICE_CONFIG.speakingRate} (slower for kids)`);
  console.log(`${'='.repeat(60)}\n`);

  const pages = [];
  let totalWords = 0;

  for (const page of book.pages) {
    console.log(`\nPage ${page.pageNumber}/${book.pages.length}`);
    const wordCount = page.text.split(' ').length;
    totalWords += wordCount;
    console.log(`  Words on this page: ${wordCount}`);

    // Generate image
    let imageUrl = '';
    const imageResult = await generateImage(page.imagePrompt);
    if (imageResult) {
      const ext = imageResult.mimeType.split('/')[1] || 'png';
      const imagePath = `books/${bookId}/images/page-${page.pageNumber}.${ext}`;
      imageUrl = await uploadToStorage(imageResult.data, imagePath, imageResult.mimeType);
      console.log(`  Image uploaded`);
    }

    // Generate audio with SLOWER speed
    let audioUrl = '';
    try {
      console.log(`  Generating audio (speed: ${VOICE_CONFIG.speakingRate})...`);
      const audioBase64 = await generateAudio(page.text, VOICE_CONFIG);
      const audioPath = `books/${bookId}/audio/page-${page.pageNumber}.mp3`;
      audioUrl = await uploadToStorage(audioBase64, audioPath, 'audio/mpeg');
      console.log(`  Audio uploaded`);
    } catch (error) {
      console.log(`  Audio failed: ${error.message}`);
    }

    pages.push({
      pageNumber: page.pageNumber,
      text: page.text,
      imageUrl,
      audioUrl
    });

    // Small delay between pages
    await sleep(1000);
  }

  // Save to Firestore
  const bookData = {
    id: bookId,
    title: book.title,
    ageRange: book.ageRange,
    theme: book.theme,
    moralLesson: book.moralLesson,
    synopsis: book.synopsis,
    coverImageUrl: pages[0]?.imageUrl || '',
    pages,
    pageCount: pages.length,
    wordCount: totalWords,
    audio: {
      status: 'ready',
      voiceName: VOICE_CONFIG.name,
      speakingRate: VOICE_CONFIG.speakingRate
    },
    status: 'published',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('books').doc(bookId).set(bookData);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`BOOK COMPLETE!`);
  console.log(`Title: ${book.title}`);
  console.log(`ID: ${bookId}`);
  console.log(`Total Pages: ${pages.length}`);
  console.log(`Total Words: ${totalWords}`);
  console.log(`Average Words/Page: ${Math.round(totalWords / pages.length)}`);
  console.log(`Voice Speed: ${VOICE_CONFIG.speakingRate} (slower for kids)`);
  console.log(`${'='.repeat(60)}\n`);
}

// Run
generateBook()
  .then(() => {
    console.log('\nDone! Test the new book in the app.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
