/**
 * Check for duplicate or very similar stories across books
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

// Simple similarity check - compare first 100 chars of each book's text
function getBookText(book) {
  if (!book.pages || book.pages.length === 0) return '';
  return book.pages.map(p => p.text).join(' ');
}

function getSimilarityScore(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/).slice(0, 50);
  const words2 = text2.toLowerCase().split(/\s+/).slice(0, 50);

  let matches = 0;
  for (const word of words1) {
    if (words2.includes(word)) matches++;
  }

  return (matches / Math.max(words1.length, words2.length)) * 100;
}

async function checkDuplicates() {
  const snapshot = await db.collection('books').get();
  const books = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  console.log('\n📚 STORY SIMILARITY ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Analyzing ${books.length} books...\n`);

  const duplicateGroups = [];
  const checked = new Set();

  for (let i = 0; i < books.length; i++) {
    if (checked.has(books[i].id)) continue;

    const group = [books[i]];
    const text1 = getBookText(books[i]);

    for (let j = i + 1; j < books.length; j++) {
      if (checked.has(books[j].id)) continue;

      const text2 = getBookText(books[j]);
      const similarity = getSimilarityScore(text1, text2);

      if (similarity > 60) { // More than 60% similar
        group.push(books[j]);
        checked.add(books[j].id);
      }
    }

    if (group.length > 1) {
      duplicateGroups.push(group);
      group.forEach(b => checked.add(b.id));
    }
  }

  if (duplicateGroups.length > 0) {
    console.log(`⚠️  Found ${duplicateGroups.length} groups with similar stories:\n`);

    duplicateGroups.forEach((group, idx) => {
      console.log(`Group ${idx + 1} (${group.length} books):`);
      group.forEach(book => {
        console.log(`  - ${book.title} (${book.ageRange})`);
        console.log(`    ID: ${book.id}`);
      });
      console.log('');
    });

    // Count total books needing rewrites
    const totalNeedingRewrites = duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0);
    console.log(`📝 Total books needing story rewrites: ${totalNeedingRewrites}`);
  } else {
    console.log('✅ All books have unique stories!');
  }

  console.log('='.repeat(70) + '\n');
  process.exit(0);
}

checkDuplicates().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
