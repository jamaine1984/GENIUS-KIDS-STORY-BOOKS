/// Book Service for Kids Storybook
/// Fetches books from Firebase Firestore
/// No tracking, no analytics - safe for kids

import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/book.dart';

/// Service to fetch and manage storybooks
class BookService {
  final FirebaseFirestore _firestore;

  BookService({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  /// Get reference to books collection
  CollectionReference<Map<String, dynamic>> get _booksCollection =>
      _firestore.collection('books');

  /// Fetch a single book by ID
  Future<Book?> getBook(String bookId) async {
    try {
      final doc = await _booksCollection.doc(bookId).get();

      if (!doc.exists) {
        return null;
      }

      final data = doc.data();
      if (data == null || data['status'] != 'published') {
        return null;
      }

      return Book.fromFirestore(doc);
    } catch (e) {
      return null;
    }
  }

  /// Fetch all published books with optional filters
  Future<List<Book>> getBooks({
    AgeRange? ageRange,
    String? theme,
    int limit = 20,
    DocumentSnapshot? startAfter,
  }) async {
    try {
      // Simple query without composite index requirement
      Query<Map<String, dynamic>> query = _booksCollection
          .where('status', isEqualTo: 'published');

      if (ageRange != null) {
        query = query.where('ageRange', isEqualTo: ageRange.value);
      }

      if (theme != null) {
        query = query.where('theme', isEqualTo: theme);
      }

      final snapshot = await query.get();

      // Sort in memory and apply limit
      List<Book> books = snapshot.docs.map((doc) => Book.fromFirestore(doc)).toList();
      books.sort((a, b) => (b.createdAt ?? DateTime(1970)).compareTo(a.createdAt ?? DateTime(1970)));

      if (books.length > limit) {
        books = books.take(limit).toList();
      }

      return books;
    } catch (e) {
      print('Error fetching books: $e');
      return [];
    }
  }

  /// Fetch featured books (for home screen)
  Future<List<Book>> getFeaturedBooks({int limit = 10}) async {
    try {
      final snapshot = await _booksCollection
          .where('status', isEqualTo: 'published')
          .get();

      List<Book> books = snapshot.docs.map((doc) => Book.fromFirestore(doc)).toList();
      books.sort((a, b) => (b.createdAt ?? DateTime(1970)).compareTo(a.createdAt ?? DateTime(1970)));

      if (books.length > limit) {
        books = books.take(limit).toList();
      }

      return books;
    } catch (e) {
      print('Error fetching featured books: $e');
      return [];
    }
  }

  /// Fetch books by age range
  Future<List<Book>> getBooksByAgeRange(AgeRange ageRange, {int limit = 20}) async {
    return getBooks(ageRange: ageRange, limit: limit);
  }

  /// Fetch books by theme/category
  Future<List<Book>> getBooksByTheme(String theme, {int limit = 20}) async {
    return getBooks(theme: theme, limit: limit);
  }

  /// Search books by title or theme
  Future<List<Book>> searchBooks(String searchTerm, {int limit = 20}) async {
    if (searchTerm.isEmpty) return [];

    try {
      // Search by theme (Firestore doesn't support full-text search)
      final snapshot = await _booksCollection
          .where('status', isEqualTo: 'published')
          .where('theme', isEqualTo: searchTerm.toLowerCase())
          .limit(limit)
          .get();

      return snapshot.docs.map((doc) => Book.fromFirestore(doc)).toList();
    } catch (e) {
      return [];
    }
  }

  /// Get books with available audio
  Future<List<Book>> getBooksWithAudio({AgeRange? ageRange, int limit = 20}) async {
    try {
      Query<Map<String, dynamic>> query = _booksCollection
          .where('status', isEqualTo: 'published');

      if (ageRange != null) {
        query = query.where('ageRange', isEqualTo: ageRange.value);
      }

      final snapshot = await query.get();

      // Filter for audio in memory and sort
      List<Book> books = snapshot.docs
          .map((doc) => Book.fromFirestore(doc))
          .where((book) => book.hasAudio)
          .toList();
      books.sort((a, b) => (b.createdAt ?? DateTime(1970)).compareTo(a.createdAt ?? DateTime(1970)));

      if (books.length > limit) {
        books = books.take(limit).toList();
      }

      return books;
    } catch (e) {
      print('Error fetching books with audio: $e');
      return [];
    }
  }

  /// Get random books for discovery
  Future<List<Book>> getRandomBooks({int count = 5}) async {
    try {
      // Get more books than needed and shuffle
      final allBooks = await getBooks(limit: count * 3);

      if (allBooks.isEmpty) return [];

      allBooks.shuffle();
      return allBooks.take(count).toList();
    } catch (e) {
      return [];
    }
  }

  /// Get total count of published books
  Future<int> getTotalBookCount() async {
    try {
      final snapshot = await _booksCollection
          .where('status', isEqualTo: 'published')
          .count()
          .get();

      return snapshot.count ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /// Get count of books by age range
  Future<Map<AgeRange, int>> getBookCountsByAgeRange() async {
    final counts = <AgeRange, int>{};

    for (final ageRange in AgeRange.values) {
      try {
        final snapshot = await _booksCollection
            .where('status', isEqualTo: 'published')
            .where('ageRange', isEqualTo: ageRange.value)
            .count()
            .get();

        counts[ageRange] = snapshot.count ?? 0;
      } catch (e) {
        counts[ageRange] = 0;
      }
    }

    return counts;
  }

  /// Stream books for real-time updates
  Stream<List<Book>> streamBooks({AgeRange? ageRange, int limit = 20}) {
    Query<Map<String, dynamic>> query = _booksCollection
        .where('status', isEqualTo: 'published');

    if (ageRange != null) {
      query = query.where('ageRange', isEqualTo: ageRange.value);
    }

    return query.snapshots().map((snapshot) {
      List<Book> books = snapshot.docs.map((doc) => Book.fromFirestore(doc)).toList();
      books.sort((a, b) => (b.createdAt ?? DateTime(1970)).compareTo(a.createdAt ?? DateTime(1970)));
      if (books.length > limit) {
        books = books.take(limit).toList();
      }
      return books;
    });
  }

  /// Stream a single book for real-time updates
  Stream<Book?> streamBook(String bookId) {
    return _booksCollection.doc(bookId).snapshots().map((doc) {
      if (!doc.exists) return null;
      final data = doc.data();
      if (data == null || data['status'] != 'published') return null;
      return Book.fromFirestore(doc);
    });
  }
}
