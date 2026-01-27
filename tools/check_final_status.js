const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'genius-kids-story-books.firebasestorage.app'
  });
}

const db = admin.firestore();

db.collection('books').get().then(snapshot => {
  let withUniqueCovers = 0;
  let withAudio = 0;
  let complete = 0;
  
  snapshot.forEach(doc => {
    const book = doc.data();
    
    const hasUniqueCover = book.coverImageUrl && (
      book.coverImageUrl.includes('/cover.png') || 
      book.coverImageUrl.includes('/cover.jpg') ||
      book.coverImageUrl.includes('/cover.jpeg')
    );
    
    const allPagesHaveAudio = book.pages && book.pages.every(p => p.audioUrl && p.audioUrl !== '');
    
    if (hasUniqueCover) withUniqueCovers++;
    if (allPagesHaveAudio) withAudio++;
    if (hasUniqueCover && allPagesHaveAudio) complete++;
  });
  
  console.log('');
  console.log('📊 FINAL BOOK STATUS');
  console.log('='.repeat(50));
  console.log('Total books:', snapshot.size);
  console.log('✅ Books with unique covers:', withUniqueCovers);
  console.log('🎙️  Books with complete audio:', withAudio);
  console.log('🎉 Fully complete books:', complete);
  console.log('='.repeat(50));
  console.log('');
  
  process.exit(0);
});
