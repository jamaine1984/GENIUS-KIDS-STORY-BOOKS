/// Book data models for Kids Storybook Library
/// All content is age-appropriate and safe for children

import 'package:cloud_firestore/cloud_firestore.dart';

/// Represents a single page in a storybook
class BookPage {
  final int pageNumber;
  final String text;
  final String imageUrl;
  final String imageStoragePath;
  final String audioUrl;

  const BookPage({
    required this.pageNumber,
    required this.text,
    required this.imageUrl,
    required this.imageStoragePath,
    required this.audioUrl,
  });

  bool get hasAudio => audioUrl.isNotEmpty;

  factory BookPage.fromMap(Map<String, dynamic> map) {
    return BookPage(
      pageNumber: map['pageNumber'] as int? ?? 0,
      text: map['text'] as String? ?? '',
      imageUrl: map['imageUrl'] as String? ?? '',
      imageStoragePath: map['imageStoragePath'] as String? ?? '',
      audioUrl: map['audioUrl'] as String? ?? '',
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'pageNumber': pageNumber,
      'text': text,
      'imageUrl': imageUrl,
      'imageStoragePath': imageStoragePath,
      'audioUrl': audioUrl,
    };
  }
}

/// Audio narration metadata
class AudioInfo {
  final String status; // 'missing', 'generating', 'ready', 'failed'
  final String publicUrl;
  final int? durationSeconds;
  final String storagePath;

  const AudioInfo({
    required this.status,
    required this.publicUrl,
    this.durationSeconds,
    required this.storagePath,
  });

  bool get isReady => status == 'ready' && publicUrl.isNotEmpty;

  factory AudioInfo.fromMap(Map<String, dynamic> map) {
    return AudioInfo(
      status: map['status'] as String? ?? 'missing',
      publicUrl: map['publicUrl'] as String? ?? '',
      durationSeconds: map['durationSec'] as int?,
      storagePath: map['storagePath'] as String? ?? '',
    );
  }

  factory AudioInfo.empty() {
    return const AudioInfo(
      status: 'missing',
      publicUrl: '',
      storagePath: '',
    );
  }
}

/// Age range categories for books
enum AgeRange {
  ages0to2('0-2', 'Ages 0-2', 'Baby & Toddler'),
  ages3to5('3-5', 'Ages 3-5', 'Preschool'),
  ages6to8('6-8', 'Ages 6-8', 'Early Reader'),
  ages9to10('9-10', 'Ages 9-10', 'Growing Reader');

  final String value;
  final String displayName;
  final String categoryName;

  const AgeRange(this.value, this.displayName, this.categoryName);

  static AgeRange fromString(String value) {
    return AgeRange.values.firstWhere(
      (e) => e.value == value,
      orElse: () => AgeRange.ages3to5,
    );
  }
}

/// Reading level categories
enum ReadingLevel {
  beginner('beginner', 'Beginner'),
  intermediate('intermediate', 'Intermediate'),
  advanced('advanced', 'Advanced');

  final String value;
  final String displayName;

  const ReadingLevel(this.value, this.displayName);

  static ReadingLevel fromString(String value) {
    return ReadingLevel.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ReadingLevel.intermediate,
    );
  }
}

/// Complete book model
class Book {
  final String bookId;
  final String title;
  final String author;
  final String coverImageUrl;
  final String synopsis;
  final AgeRange ageRange;
  final ReadingLevel readingLevel;
  final List<String> tags;
  final String theme;
  final String moralLesson;
  final List<BookPage> pages;
  final int wordCount;
  final int pageCount;
  final AudioInfo audio;
  final DateTime? createdAt;

  const Book({
    required this.bookId,
    required this.title,
    required this.author,
    required this.coverImageUrl,
    required this.synopsis,
    required this.ageRange,
    required this.readingLevel,
    required this.tags,
    required this.theme,
    required this.moralLesson,
    required this.pages,
    required this.wordCount,
    required this.pageCount,
    required this.audio,
    this.createdAt,
  });

  /// Check if audio narration is available (book-level or page-level)
  bool get hasAudio => audio.isReady || pages.any((page) => page.hasAudio);

  /// Get estimated reading time in minutes
  int get estimatedReadingMinutes {
    // Average reading speed for children: 100-150 words per minute
    const wordsPerMinute = 120;
    return (wordCount / wordsPerMinute).ceil().clamp(1, 60);
  }

  factory Book.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};

    final pagesData = data['pages'] as List<dynamic>? ?? [];
    final pages = pagesData
        .map((p) => BookPage.fromMap(p as Map<String, dynamic>))
        .toList();

    final audioData = data['audio'] as Map<String, dynamic>?;

    return Book(
      bookId: doc.id,
      title: data['title'] as String? ?? 'Untitled Story',
      author: data['author'] as String? ?? 'Storybook Creator',
      coverImageUrl: data['coverImageUrl'] as String? ?? '',
      synopsis: data['synopsis'] as String? ?? '',
      ageRange: AgeRange.fromString(data['ageRange'] as String? ?? '6-8'),
      readingLevel:
          ReadingLevel.fromString(data['readingLevel'] as String? ?? 'intermediate'),
      tags: List<String>.from(data['tags'] as List? ?? []),
      theme: data['theme'] as String? ?? '',
      moralLesson: data['moralLesson'] as String? ?? '',
      pages: pages,
      wordCount: data['wordCount'] as int? ?? 0,
      pageCount: data['pageCount'] as int? ?? pages.length,
      audio: audioData != null ? AudioInfo.fromMap(audioData) : AudioInfo.empty(),
      createdAt: (data['createdAt'] as Timestamp?)?.toDate(),
    );
  }

  /// Create a copy with updated fields
  Book copyWith({
    String? bookId,
    String? title,
    String? author,
    String? coverImageUrl,
    String? synopsis,
    AgeRange? ageRange,
    ReadingLevel? readingLevel,
    List<String>? tags,
    String? theme,
    String? moralLesson,
    List<BookPage>? pages,
    int? wordCount,
    int? pageCount,
    AudioInfo? audio,
    DateTime? createdAt,
  }) {
    return Book(
      bookId: bookId ?? this.bookId,
      title: title ?? this.title,
      author: author ?? this.author,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      synopsis: synopsis ?? this.synopsis,
      ageRange: ageRange ?? this.ageRange,
      readingLevel: readingLevel ?? this.readingLevel,
      tags: tags ?? this.tags,
      theme: theme ?? this.theme,
      moralLesson: moralLesson ?? this.moralLesson,
      pages: pages ?? this.pages,
      wordCount: wordCount ?? this.wordCount,
      pageCount: pageCount ?? this.pageCount,
      audio: audio ?? this.audio,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

/// Book category for browsing
class BookCategory {
  final String id;
  final String name;
  final String emoji;
  final String description;

  const BookCategory({
    required this.id,
    required this.name,
    required this.emoji,
    required this.description,
  });
}

/// Predefined book categories
class BookCategories {
  static const List<BookCategory> all = [
    BookCategory(
      id: 'adventure',
      name: 'Adventure',
      emoji: '🗺️',
      description: 'Exciting journeys and discoveries',
    ),
    BookCategory(
      id: 'animals',
      name: 'Animals',
      emoji: '🐾',
      description: 'Stories about furry friends',
    ),
    BookCategory(
      id: 'friendship',
      name: 'Friendship',
      emoji: '🤝',
      description: 'Tales about being a good friend',
    ),
    BookCategory(
      id: 'family',
      name: 'Family',
      emoji: '👨‍👩‍👧‍👦',
      description: 'Stories about love and family',
    ),
    BookCategory(
      id: 'nature',
      name: 'Nature',
      emoji: '🌳',
      description: 'Exploring the natural world',
    ),
    BookCategory(
      id: 'fantasy',
      name: 'Fantasy',
      emoji: '✨',
      description: 'Magical and imaginative tales',
    ),
    BookCategory(
      id: 'learning',
      name: 'Learning',
      emoji: '📚',
      description: 'Educational and fun stories',
    ),
    BookCategory(
      id: 'bedtime',
      name: 'Bedtime',
      emoji: '🌙',
      description: 'Peaceful stories for sleep time',
    ),
  ];

  static BookCategory? findById(String id) {
    try {
      return all.firstWhere((c) => c.id == id);
    } catch (_) {
      return null;
    }
  }
}
