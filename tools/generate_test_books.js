/**
 * Test Book Generator - Creates 2 sample books with images and audio
 * Budget-conscious: Test before full generation
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('\n❌ ERROR: serviceAccountKey.json not found!');
  console.log('\nPlease download it from Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Select project: genius-kids-story-books');
  console.log('3. Project Settings > Service Accounts');
  console.log('4. Click "Generate New Private Key"');
  console.log('5. Save the file as: tools/serviceAccountKey.json\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'genius-kids-story-books.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Google AI API Key
const GOOGLE_API_KEY = 'AIzaSyBcv2nBXJ_EdoCwfWT_CatCEI7rRdJZlmE';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Voice mapping by age - using natural sounding voices
const VOICE_BY_AGE = {
  '0-2': { name: 'en-US-Studio-O', gender: 'FEMALE' },  // Soft, warm female
  '3-5': { name: 'en-US-Studio-O', gender: 'FEMALE' },  // Friendly female
  '6-8': { name: 'en-US-Studio-Q', gender: 'MALE' },    // Engaging male storyteller
  '9-10': { name: 'en-US-Studio-Q', gender: 'MALE' }    // Mature storyteller
};

// ============================================
// BOOK 1: Ages 0-2 - "Bubbles the Happy Fish"
// ============================================
const book1 = {
  title: "Bubbles the Happy Fish",
  ageRange: "0-2",
  theme: "colors",
  moralLesson: "Being happy and friendly",
  synopsis: "A colorful fish named Bubbles swims through the ocean meeting friends of different colors.",
  pages: [
    {
      pageNumber: 1,
      text: "This is Bubbles. Bubbles is a little fish. Bubbles is blue!",
      imagePrompt: "Cute cartoon baby blue fish with big friendly eyes, smiling, swimming in clear blue ocean water, children's book illustration style, bright colors, simple background, adorable, digital art"
    },
    {
      pageNumber: 2,
      text: "Bubbles swims and swims. Splash, splash, splash!",
      imagePrompt: "Cute blue cartoon fish swimming happily with small splash effects around it, underwater scene, children's book illustration, bright cheerful colors, simple and clean, digital art"
    },
    {
      pageNumber: 3,
      text: "Look! A red crab! Hello, red crab!",
      imagePrompt: "Cute blue fish meeting a friendly red cartoon crab on sandy ocean floor, both smiling, children's book illustration style, bright colors, adorable characters, digital art"
    },
    {
      pageNumber: 4,
      text: "Look! A yellow starfish! Hello, yellow starfish!",
      imagePrompt: "Cute blue fish next to a happy yellow starfish on a rock, underwater scene, children's book illustration style, bright cheerful colors, friendly faces, digital art"
    },
    {
      pageNumber: 5,
      text: "Look! A green turtle! Hello, green turtle!",
      imagePrompt: "Cute blue fish swimming alongside a friendly green sea turtle, both smiling, underwater scene, children's book illustration style, bright colors, digital art"
    },
    {
      pageNumber: 6,
      text: "Bubbles loves all the colors! Red, yellow, green, and blue!",
      imagePrompt: "Cute blue fish surrounded by colorful sea friends - red crab, yellow starfish, green turtle, all happy together underwater, children's book illustration, bright rainbow colors, digital art"
    },
    {
      pageNumber: 7,
      text: "Bubbles waves goodbye. Bye bye, friends!",
      imagePrompt: "Cute blue fish waving a fin goodbye to colorful sea friends in the background, warm sunset colors in the water, children's book illustration style, sweet and heartwarming, digital art"
    },
    {
      pageNumber: 8,
      text: "Bubbles goes home to sleep. Goodnight, Bubbles!",
      imagePrompt: "Cute blue fish sleeping peacefully in a cozy underwater home with soft moonlight filtering through water, children's book illustration style, calm and soothing colors, nighttime scene, digital art"
    }
  ]
};

// ============================================
// BOOK 2: Ages 6-8 - "The Brave Little Robot"
// ============================================
const book2 = {
  title: "The Brave Little Robot",
  ageRange: "6-8",
  theme: "adventure",
  moralLesson: "Being brave means helping others even when you are scared",
  synopsis: "A small robot named Zip discovers that true bravery is not about being fearless, but about helping friends when they need you most.",
  pages: [
    {
      pageNumber: 1,
      text: "In a city full of robots, there lived a small robot named Zip. Zip was the smallest robot in the whole city. The bigger robots could lift heavy things and run super fast, but Zip could only beep and roll around slowly.",
      imagePrompt: "Small cute silver robot with big blue glowing eyes in a futuristic city with larger robots in background, children's book illustration style, friendly and colorful, detailed but not scary, digital art"
    },
    {
      pageNumber: 2,
      text: "I wish I was brave like the big robots, Zip said to his best friend, a robot dog named Bolt. Bolt wagged his metal tail. You are brave, Zip! You just do not know it yet.",
      imagePrompt: "Small silver robot talking to a friendly robot dog with wagging tail, futuristic park setting, children's book illustration style, warm friendship scene, bright colors, digital art"
    },
    {
      pageNumber: 3,
      text: "One day, a loud alarm rang through the city. Beep beep beep! Oh no, shouted the robots. There is a fire in the old factory! Someone is trapped inside!",
      imagePrompt: "Futuristic city with robots looking worried, alarm lights flashing, smoke coming from a building in distance, children's book illustration style, dramatic but not too scary, bright colors, digital art"
    },
    {
      pageNumber: 4,
      text: "The big robots rushed to help, but they were too big to fit through the tiny broken window. The hole is too small, they cried. We cannot get inside!",
      imagePrompt: "Large robots gathered around a building with a small window, looking worried, smoke around, children's book illustration style, showing the problem clearly, digital art"
    },
    {
      pageNumber: 5,
      text: "Zip looked at the small window. His wheels were shaking. He was very scared. But then he heard a tiny voice from inside. Help! Please help me! It was a little robot kitten!",
      imagePrompt: "Small silver robot looking at tiny window with determination, scared but brave expression, small robot kitten visible through smoky window, children's book illustration style, emotional scene, digital art"
    },
    {
      pageNumber: 6,
      text: "Zip took a deep breath. I can fit through that window, he said quietly. Bolt nudged him gently. You can do it, Zip. I believe in you.",
      imagePrompt: "Small silver robot looking determined with robot dog friend encouraging him, other robots watching hopefully, children's book illustration style, inspiring moment, digital art"
    },
    {
      pageNumber: 7,
      text: "Zip rolled toward the window. His little wheels carried him through the smoke. It was dark and scary inside, but Zip kept going. He had to find the kitten!",
      imagePrompt: "Small brave robot rolling through smoky dark factory interior, glowing blue eyes lighting the way, children's book illustration style, adventurous but not too frightening, digital art"
    },
    {
      pageNumber: 8,
      text: "Over here, mewed the little kitten. Zip found her hiding under a table. Do not worry, said Zip. I will get you out of here. Climb on my back and hold on tight!",
      imagePrompt: "Small silver robot finding scared robot kitten under a table, comforting scene, robot extending helping hand, children's book illustration style, heartwarming rescue moment, digital art"
    },
    {
      pageNumber: 9,
      text: "Zip carried the kitten carefully through the smoke. He rolled as fast as his little wheels could go. Finally, they reached the window and climbed out to safety!",
      imagePrompt: "Small robot with kitten on back climbing out of window to safety, other robots cheering outside, smoke behind them, children's book illustration style, triumphant escape scene, digital art"
    },
    {
      pageNumber: 10,
      text: "All the robots cheered! Hooray for Zip! You are the bravest robot in the whole city! Zip smiled his biggest smile. He learned that being brave does not mean you are not scared. It means you help others even when you are afraid.",
      imagePrompt: "Small silver robot hero surrounded by cheering robots of all sizes, robot kitten hugging him, celebration scene, confetti, children's book illustration style, joyful and colorful ending, digital art"
    }
  ]
};

// Books to generate
const TEST_BOOKS = [book1, book2];

/**
 * Generate image using Imagen 3 via Google AI
 */
async function generateImage(prompt, bookId, pageNumber) {
  try {
    console.log(`  🎨 Generating image for page ${pageNumber}...`);

    // Use Imagen 3 model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{
            prompt: `Children's book illustration, cute and colorful: ${prompt}`
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: "4:3",
            personGeneration: "dont_allow",
            safetyFilterLevel: "block_some"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      // If Imagen not available, try Gemini with image output
      if (response.status === 404) {
        return await generateImageWithGemini(prompt, bookId, pageNumber);
      }

      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
      const imageData = data.predictions[0].bytesBase64Encoded;

      // Upload to Firebase Storage
      const fileName = `books/${bookId}/page_${pageNumber}.png`;
      const file = bucket.file(fileName);

      const buffer = Buffer.from(imageData, 'base64');
      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000',
        }
      });

      // Make public and get URL
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      console.log(`  ✅ Image uploaded: page ${pageNumber}`);
      return { url: publicUrl, storagePath: fileName };
    }

    throw new Error('No image data in response');

  } catch (error) {
    console.error(`  ❌ Image generation failed for page ${pageNumber}:`, error.message);
    return { url: '', storagePath: '' };
  }
}

/**
 * Fallback: Generate image using Gemini 2.0 Flash
 */
async function generateImageWithGemini(prompt, bookId, pageNumber) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: ["image", "text"]
      }
    });

    const result = await model.generateContent(`Create a children's book illustration: ${prompt}. Style: colorful, friendly, digital art for kids.`);
    const response = result.response;

    // Check for image in response
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';

          const ext = mimeType.includes('jpeg') ? 'jpg' : 'png';
          const fileName = `books/${bookId}/page_${pageNumber}.${ext}`;
          const file = bucket.file(fileName);

          const buffer = Buffer.from(imageData, 'base64');
          await file.save(buffer, {
            metadata: {
              contentType: mimeType,
              cacheControl: 'public, max-age=31536000',
            }
          });

          await file.makePublic();
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          console.log(`  ✅ Image uploaded (Gemini): page ${pageNumber}`);
          return { url: publicUrl, storagePath: fileName };
        }
      }
    }

    throw new Error('No image in Gemini response');
  } catch (error) {
    throw error;
  }
}

/**
 * Generate audio narration using Google Cloud Text-to-Speech
 */
async function generateAudio(text, bookId, ageRange) {
  try {
    const voiceConfig = VOICE_BY_AGE[ageRange] || VOICE_BY_AGE['3-5'];
    console.log(`  🔊 Generating audio with voice: ${voiceConfig.name}...`);

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: text },
          voice: {
            languageCode: 'en-US',
            name: voiceConfig.name,
            ssmlGender: voiceConfig.gender
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: ageRange === '0-2' ? 0.85 : ageRange === '3-5' ? 0.9 : 1.0,
            pitch: ageRange === '0-2' ? 2.0 : ageRange === '3-5' ? 1.0 : 0.0
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`TTS API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (data.audioContent) {
      // Upload to Firebase Storage
      const fileName = `books/${bookId}/narration.mp3`;
      const file = bucket.file(fileName);

      const buffer = Buffer.from(data.audioContent, 'base64');
      await file.save(buffer, {
        metadata: {
          contentType: 'audio/mp3',
          cacheControl: 'public, max-age=31536000',
        }
      });

      // Make public and get URL
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Estimate duration (roughly 2.5 words per second for children's narration)
      const wordCount = text.split(/\s+/).length;
      const durationSec = Math.ceil(wordCount / 2.5);

      console.log(`  ✅ Audio uploaded successfully (${durationSec}s estimated)`);
      return {
        url: publicUrl,
        storagePath: fileName,
        durationSec: durationSec
      };
    }

    throw new Error('No audio content in response');

  } catch (error) {
    console.error(`  ❌ Audio generation failed:`, error.message);
    return { url: '', storagePath: '', durationSec: 0 };
  }
}

/**
 * Generate a complete book
 */
async function generateBook(bookData) {
  console.log(`\n${'═'.repeat(55)}`);
  console.log(`📚 Generating: "${bookData.title}"`);
  console.log(`   Age Range: ${bookData.ageRange} | Theme: ${bookData.theme}`);
  console.log(`${'═'.repeat(55)}`);

  // Create book ID
  const bookId = bookData.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

  // Generate cover image
  console.log('\n📕 Creating cover image...');
  const coverPrompt = `Children's book cover illustration: ${bookData.pages[0].imagePrompt}. Beautiful book cover design, title space at bottom, professional quality.`;
  const coverImage = await generateImage(coverPrompt, bookId, 'cover');

  // Generate page images
  console.log('\n📖 Creating page illustrations...');
  const pages = [];
  for (const page of bookData.pages) {
    const image = await generateImage(page.imagePrompt, bookId, page.pageNumber);
    pages.push({
      pageNumber: page.pageNumber,
      text: page.text,
      imageUrl: image.url,
      imageStoragePath: image.storagePath
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Combine all text for audio narration
  console.log('\n🎙️ Creating audio narration...');
  const fullText = bookData.pages.map(p => p.text).join(' ');
  const audio = await generateAudio(fullText, bookId, bookData.ageRange);

  // Calculate word count
  const wordCount = fullText.split(/\s+/).length;

  // Create Firestore document
  const bookDoc = {
    title: bookData.title,
    author: 'Genius Kids Stories',
    ageRange: bookData.ageRange,
    theme: bookData.theme,
    moralLesson: bookData.moralLesson,
    synopsis: bookData.synopsis,
    coverImageUrl: coverImage.url,
    coverStoragePath: coverImage.storagePath,
    pages: pages,
    pageCount: pages.length,
    wordCount: wordCount,
    readingLevel: bookData.ageRange === '0-2' ? 'beginner' :
                  bookData.ageRange === '3-5' ? 'beginner' :
                  bookData.ageRange === '6-8' ? 'intermediate' : 'advanced',
    audio: {
      status: audio.url ? 'ready' : 'missing',
      publicUrl: audio.url,
      storagePath: audio.storagePath,
      durationSec: audio.durationSec,
      voiceName: VOICE_BY_AGE[bookData.ageRange]?.name || 'en-US-Studio-O'
    },
    tags: [bookData.theme, bookData.ageRange, 'kids', 'story'],
    status: 'published',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Save to Firestore
  console.log('\n💾 Saving to database...');
  await db.collection('books').doc(bookId).set(bookDoc);

  const imagesGenerated = pages.filter(p => p.imageUrl).length + (coverImage.url ? 1 : 0);
  const totalImages = pages.length + 1;

  console.log(`\n✨ Book Complete: "${bookData.title}"`);
  console.log(`   📖 Pages: ${pages.length}`);
  console.log(`   🖼️  Images: ${imagesGenerated}/${totalImages}`);
  console.log(`   🔊 Audio: ${audio.url ? 'Ready' : 'Failed'}`);
  console.log(`   📝 Words: ${wordCount}`);

  return bookId;
}

/**
 * Main function
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🌟 GENIUS KIDS STORY BOOKS - Test Generation 🌟     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📚 Generating ${TEST_BOOKS.length} test books...`);
  console.log('💰 Budget Mode: Testing with 2 books first\n');

  const generatedBooks = [];
  const startTime = Date.now();

  for (const book of TEST_BOOKS) {
    try {
      const bookId = await generateBook(book);
      generatedBooks.push({ id: bookId, title: book.title });
    } catch (error) {
      console.error(`\n❌ Failed to generate "${book.title}":`, error.message);
    }
  }

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║              📊 GENERATION COMPLETE                     ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n⏱️  Duration: ${duration} minutes`);
  console.log(`✅ Successfully generated: ${generatedBooks.length}/${TEST_BOOKS.length} books\n`);

  if (generatedBooks.length > 0) {
    console.log('📚 Generated Books:');
    generatedBooks.forEach(book => {
      console.log(`   • ${book.title} (ID: ${book.id})`);
    });
  }

  console.log('\n🎉 You can now run the Flutter app to test the books!');
  console.log('   cd ../flutter_app && flutter run\n');

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
