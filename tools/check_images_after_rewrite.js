/**
 * Check image URLs after story rewrite
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

async function checkImages() {
  const snapshot = await db.collection('books').get();

  console.log('\n📊 IMAGE STATUS CHECK');
  console.log('='.repeat(70));

  let booksWithMissingImages = 0;
  const problematicBooks = [];

  for (const doc of snapshot.docs) {
    const book = doc.data();
    let missingCount = 0;

    if (book.pages) {
      book.pages.forEach(page => {
        if (!page.imageUrl || page.imageUrl === '') {
          missingCount++;
        }
      });
    }

    if (missingCount > 0) {
      booksWithMissingImages++;
      problematicBooks.push({
        id: doc.id,
        title: book.title,
        totalPages: book.pages ? book.pages.length : 0,
        missingImages: missingCount
      });
    }
  }

  console.log(`Total books: ${snapshot.size}`);
  console.log(`Books with missing images: ${booksWithMissingImages}`);
  console.log('');

  if (problematicBooks.length > 0) {
    console.log('Books with missing images:');
    problematicBooks.forEach(book => {
      console.log(`- ${book.title}: ${book.missingImages}/${book.totalPages} pages missing`);
    });
  }

  console.log('='.repeat(70) + '\n');
  process.exit(0);
}

checkImages().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
