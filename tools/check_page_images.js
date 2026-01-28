/**
 * Check which books have missing or problematic page images
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

async function checkPageImages() {
  const snapshot = await db.collection('books').get();

  const booksNeedingFixes = [];
  let totalBooks = 0;
  let booksWithIssues = 0;

  for (const doc of snapshot.docs) {
    totalBooks++;
    const book = doc.data();

    let missingPageImages = [];
    let totalPages = book.pages ? book.pages.length : 0;

    if (book.pages) {
      book.pages.forEach((page, index) => {
        if (!page.imageUrl || page.imageUrl === '') {
          missingPageImages.push(page.pageNumber);
        }
      });
    }

    if (missingPageImages.length > 0) {
      booksWithIssues++;
      booksNeedingFixes.push({
        id: doc.id,
        title: book.title,
        ageRange: book.ageRange,
        totalPages,
        missingPages: missingPageImages,
        percentMissing: Math.round((missingPageImages.length / totalPages) * 100)
      });
    }
  }

  console.log('\n📊 PAGE IMAGE ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Total books: ${totalBooks}`);
  console.log(`Books with missing page images: ${booksWithIssues}`);
  console.log(`Books with all page images: ${totalBooks - booksWithIssues}`);
  console.log('');

  if (booksNeedingFixes.length > 0) {
    console.log('📋 BOOKS NEEDING PAGE IMAGE FIXES:');
    console.log('='.repeat(70));

    // Sort by most missing to least
    booksNeedingFixes.sort((a, b) => b.percentMissing - a.percentMissing);

    booksNeedingFixes.forEach((book, i) => {
      console.log(`${i+1}. ${book.title} (${book.ageRange})`);
      console.log(`   ID: ${book.id}`);
      console.log(`   Missing: ${book.missingPages.length}/${book.totalPages} pages (${book.percentMissing}%)`);
      console.log(`   Pages needing images: ${book.missingPages.join(', ')}`);
      console.log('');
    });

    console.log('💡 NEXT STEP:');
    console.log('Run fix_page_images.js to regenerate missing page images');
  } else {
    console.log('🎉 All books have complete page images!');
  }

  console.log('='.repeat(70) + '\n');

  process.exit(0);
}

checkPageImages().catch(e => { console.error('Error:', e); process.exit(1); });
