/**
 * Create a welcoming cover image for the app home page
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

const bucket = admin.storage().bucket();

// Google AI
const GOOGLE_API_KEY = 'AIzaSyAtaLYBku6EmcnFp8puSL8tGtqwgHw22Uk';
const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function generateWelcomeCover() {
  console.log('\n🎨 CREATING WELCOME COVER IMAGE');
  console.log('='.repeat(70));
  console.log('');

  const coverPrompt = `Create a beautiful, inviting welcome cover illustration for a children's storybook app called "Genius Kids Story Books".

The image should feature:
- Diverse group of happy children (ages 0-10) reading colorful books together
- Magical, whimsical atmosphere with sparkles, stars, or floating books
- Warm, inviting colors (bright blues, yellows, pinks, greens)
- Friendly, inclusive feel that welcomes all children
- Characters of different ethnicities and abilities
- Sense of wonder, imagination, and learning
- Cozy reading environment (maybe under a tree, on a cloud, or in a magical library)
- NO TEXT in the image

Style: Vibrant, professional children's book illustration quality, warm and inviting, magical and enchanting.`;

  try {
    console.log('📝 Generating welcome cover image...');

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: coverPrompt }]
      }],
      generationConfig: { responseModalities: ['image', 'text'] }
    });

    const response = await result.response;

    // Find image in response
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        console.log('✅ Image generated successfully!');

        // Upload to Firebase Storage
        const imageData = part.inlineData.data;
        const ext = part.inlineData.mimeType.split('/')[1] || 'png';
        const filePath = `app/welcome_cover.${ext}`;

        console.log('📤 Uploading to Firebase Storage...');

        const buffer = Buffer.from(imageData, 'base64');
        const file = bucket.file(filePath);
        await file.save(buffer, {
          metadata: { contentType: part.inlineData.mimeType },
          public: true
        });

        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        console.log('✅ Upload complete!');
        console.log('');
        console.log('Welcome Cover URL:');
        console.log(imageUrl);
        console.log('');
        console.log('='.repeat(70));
        console.log('🎉 Welcome cover created successfully!');
        console.log('Add this URL to your app\'s welcome/home screen.');
        console.log('='.repeat(70));
        console.log('');

        return imageUrl;
      }
    }

    throw new Error('No image found in response');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateWelcomeCover()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
