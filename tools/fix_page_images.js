/**
 * Fix Page Images - Regenerate missing page images with story-specific content
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
const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Generate page image based on story text
async function generatePageImage(pageText, title, theme, ageRange, pageNumber, retries = 3) {
  const ageStyle = {
    '0-2': 'super simple, bold colors, very cute, baby-friendly, minimal details, board book style',
    '3-5': 'colorful, friendly characters, playful, preschool style, warm and inviting',
    '6-8': 'detailed illustration, adventure feel, engaging characters, exciting scene',
    '9-10': 'sophisticated children\'s book art, dynamic composition, mature but kid-friendly'
  };

  const imagePrompt = `Create a beautiful children's book illustration for page ${pageNumber} of "${title}".
Story text on this page: "${pageText}"
Theme: ${theme}
Style: ${ageStyle[ageRange] || ageStyle['3-5']}
Requirements:
- Illustrate the SPECIFIC scene/content from the page text above
- Match the story content, characters, and action described
- ${ageStyle[ageRange] || ageStyle['3-5']}
- Professional children's book illustration quality
- Eye-catching and engaging for kids
- NO TEXT in the image`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: imagePrompt }]
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
async function fixPageImages() {
  console.log('\n🖼️  PAGE IMAGE FIX TOOL');
  console.log('='.repeat(70));
  console.log('');

  // Get all books
  const snapshot = await db.collection('books').get();

  const booksNeedingFixes = [];

  // Find books with missing page images
  for (const doc of snapshot.docs) {
    const book = doc.data();
    let missingPageIndices = [];

    if (book.pages) {
      book.pages.forEach((page, index) => {
        if (!page.imageUrl || page.imageUrl === '') {
          missingPageIndices.push(index);
        }
      });
    }

    if (missingPageIndices.length > 0) {
      booksNeedingFixes.push({
        id: doc.id,
        title: book.title,
        theme: book.theme,
        ageRange: book.ageRange,
        pages: book.pages,
        missingIndices: missingPageIndices
      });
    }
  }

  console.log(`📚 Found ${booksNeedingFixes.length} books needing page image fixes`);
  console.log(`📄 Total pages to regenerate: ${booksNeedingFixes.reduce((sum, b) => sum + b.missingIndices.length, 0)}`);
  console.log('');

  if (booksNeedingFixes.length === 0) {
    console.log('🎉 All books have complete page images!');
    console.log('='.repeat(70) + '\n');
    process.exit(0);
  }

  let totalFixed = 0;
  let totalFailed = 0;

  for (let i = 0; i < booksNeedingFixes.length; i++) {
    const book = booksNeedingFixes[i];
    console.log(`[${i + 1}/${booksNeedingFixes.length}] ${book.title}`);
    console.log(`   Missing ${book.missingIndices.length} page images`);

    // Create a copy of pages that we'll update locally
    const updatedPages = [...book.pages];

    for (const pageIndex of book.missingIndices) {
      const page = book.pages[pageIndex];
      console.log(`   📄 Page ${page.pageNumber}...`);

      try {
        // Generate page image
        const imageResult = await generatePageImage(
          page.text,
          book.title,
          book.theme,
          book.ageRange,
          page.pageNumber
        );

        if (imageResult) {
          const ext = imageResult.mimeType.split('/')[1] || 'png';
          const imagePath = `books/${book.id}/page_${page.pageNumber}.${ext}`;
          const imageUrl = await uploadToStorage(imageResult.data, imagePath, imageResult.mimeType);

          // Update the local pages array
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            imageUrl: imageUrl,
            imageStoragePath: imagePath
          };

          console.log(`      ✅ Page ${page.pageNumber} image uploaded!`);
          totalFixed++;
        } else {
          console.log(`      ⚠️  Failed to generate image for page ${page.pageNumber}`);
          totalFailed++;
        }
      } catch (error) {
        console.log(`      ❌ Error on page ${page.pageNumber}: ${error.message}`);
        totalFailed++;
      }

      // Rate limiting - 7 seconds between requests
      await sleep(7000);
    }

    // Update Firestore once with all page changes for this book
    try {
      await db.collection('books').doc(book.id).update({
        pages: updatedPages,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`   💾 Saved all updates to Firestore`);
    } catch (error) {
      console.log(`   ❌ Error saving to Firestore: ${error.message}`);
    }

    console.log('');

    // Progress update every 5 books
    if ((i + 1) % 5 === 0) {
      console.log(`📊 Progress: ${i + 1}/${booksNeedingFixes.length} books | ✅ ${totalFixed} pages | ❌ ${totalFailed} pages`);
      console.log('');
    }
  }

  console.log('='.repeat(70));
  console.log('🎉 PAGE IMAGE FIX COMPLETE!');
  console.log(`✅ Fixed: ${totalFixed} pages`);
  console.log(`❌ Failed: ${totalFailed} pages`);
  console.log('='.repeat(70));
  console.log('');

  process.exit(0);
}

// Run
fixPageImages().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
