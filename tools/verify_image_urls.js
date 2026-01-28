/**
 * Verify that image URLs actually work and files exist
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'genius-kids-story-books.firebasestorage.app'
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function verifyImages() {
  console.log('\n🔍 VERIFYING IMAGE URLS');
  console.log('='.repeat(70));

  const snapshot = await db.collection('books').limit(5).get();

  for (const doc of snapshot.docs) {
    const book = doc.data();
    console.log(`\n📖 ${book.title}`);

    if (book.pages) {
      for (let i = 0; i < Math.min(3, book.pages.length); i++) {
        const page = book.pages[i];
        console.log(`  Page ${page.pageNumber}:`);
        console.log(`    ImageURL: ${page.imageUrl ? page.imageUrl.substring(0, 80) + '...' : 'MISSING'}`);

        if (page.imageUrl) {
          try {
            // Extract file path from URL
            const urlParts = page.imageUrl.split('/');
            const bucketName = urlParts[3];
            const filePath = decodeURIComponent(urlParts.slice(4).join('/'));

            console.log(`    FilePath: ${filePath}`);

            // Check if file exists
            const file = bucket.file(filePath);
            const [exists] = await file.exists();
            console.log(`    Exists: ${exists ? '✅ YES' : '❌ NO'}`);
          } catch (error) {
            console.log(`    Error checking: ${error.message}`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
  process.exit(0);
}

verifyImages().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
