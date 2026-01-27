/**
 * Update Book Covers - Generate unique cover images for all books
 * Each cover will be a beautiful illustration representing the story
 */

const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
const GOOGLE_API_KEY = 'AIzaSyBcv2nBXJ_EdoCwfWT_CatCEI7rRdJZlmE';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Generate cover image
async function generateCoverImage(title, theme, ageRange, synopsis, retries = 3) {
  const ageStyle = {
    '0-2': 'super simple, bold colors, very cute, baby-friendly, minimal details',
    '3-5': 'colorful, friendly characters, playful, preschool style, warm and inviting',
    '6-8': 'detailed illustration, adventure feel, engaging characters, exciting scene',
    '9-10': 'sophisticated children\'s book art, dynamic composition, mature but kid-friendly'
  };

  const coverPrompt = `Create a beautiful children's book COVER illustration for "${title}".
Theme: ${theme}.
Story: ${synopsis}.
Style: ${ageStyle[ageRange] || ageStyle['3-5']}.
Requirements:
- Book cover composition (title space at top)
- Main character or scene prominently featured
- Eye-catching and colorful
- Professional children's book cover quality
- Inviting and makes kids want to read the book
- NO TEXT in the image`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: coverPrompt }]
        }],
        generationConfig: { responseModalities: ['image', 'text'] }
      });

      const response = await result.response;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
          return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
        }
      }
      throw new Error('No image in response');
    } catch (error) {
      console.log(`     Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) return null;
      await sleep(2000 * attempt);
    }
  }
  return null;
}

// Upload to Firebase Storage
async function uploadToStorage(data, filePath, contentType) {
  const buffer = Buffer.from(data, 'base64');
  const file = bucket.file(filePath);
  await file.save(buffer, { metadata: { contentType }, public: true });
  return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Main function
async function updateAllCovers() {
  console.log('\n🎨 COVER IMAGE UPDATER');
  console.log('======================\n');

  // Get all books
  const snapshot = await db.collection('books').get();
  const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  console.log(`📚 Found ${books.length} books to update\n`);

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < books.length; i++) {
    const book = books[i];
    console.log(`[${i + 1}/${books.length}] ${book.title}`);
    console.log(`   Theme: ${book.theme} | Age: ${book.ageRange}`);

    // Skip if already has a cover from this run (check if cover.png or cover.jpg exists)
    if (book.coverImageUrl && (book.coverImageUrl.includes('/cover.png') || book.coverImageUrl.includes('/cover.jpg') || book.coverImageUrl.includes('/cover.jpeg'))) {
      console.log(`   ⏭️  Already has unique cover, skipping`);
      updated++;
      await sleep(500); // Small delay
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 Progress: ${i + 1}/${books.length} | ✅ ${updated} | ❌ ${failed}\n`);
      }
      continue;
    }

    try {
      // Generate new cover image
      const coverResult = await generateCoverImage(
        book.title,
        book.theme,
        book.ageRange,
        book.synopsis || book.moralLesson
      );

      if (coverResult) {
        const ext = coverResult.mimeType.split('/')[1] || 'png';
        const coverPath = `books/${book.id}/cover.${ext}`;
        const coverUrl = await uploadToStorage(coverResult.data, coverPath, coverResult.mimeType);

        // Update Firestore
        await db.collection('books').doc(book.id).update({
          coverImageUrl: coverUrl,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`   ✅ New cover uploaded!`);
        updated++;
      } else {
        console.log(`   ⚠️ Could not generate cover, keeping existing`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }

    // Rate limiting - 7 seconds to stay under 10 requests/minute
    await sleep(7000);

    // Progress update
    if ((i + 1) % 10 === 0) {
      console.log(`\n📊 Progress: ${i + 1}/${books.length} | ✅ ${updated} | ❌ ${failed}\n`);
    }
  }

  console.log('\n======================');
  console.log('🎉 COVER UPDATE COMPLETE!');
  console.log(`✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('======================\n');
}

// Run
updateAllCovers()
  .then(() => process.exit(0))
  .catch(error => { console.error('Fatal error:', error); process.exit(1); });
