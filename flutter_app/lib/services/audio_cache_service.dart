/// Audio Cache Service for Kids Storybook
/// Downloads and caches audio files locally for offline playback
/// No tracking, no analytics - safe for kids

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:hive/hive.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

/// Manages offline audio caching
class AudioCacheService {
  static const String _cacheBoxName = 'audio_cache';
  static const String _audioCacheDir = 'audio_cache';

  late Box<Map> _cacheBox;
  late Directory _cacheDirectory;
  final Dio _dio;

  bool _isInitialized = false;

  AudioCacheService() : _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(minutes: 5),
  ));

  /// Initialize the cache service
  Future<void> initialize() async {
    if (_isInitialized) return;

    // Set up cache directory
    final appDir = await getApplicationDocumentsDirectory();
    _cacheDirectory = Directory('${appDir.path}/$_audioCacheDir');

    if (!await _cacheDirectory.exists()) {
      await _cacheDirectory.create(recursive: true);
    }

    // Open Hive box for cache metadata
    _cacheBox = await Hive.openBox<Map>(_cacheBoxName);

    _isInitialized = true;
  }

  /// Get the local file path for a cached audio file
  String _getLocalPath(String bookId) {
    return '${_cacheDirectory.path}/$bookId.wav';
  }

  /// Generate a cache key from the URL
  String _getCacheKey(String url) {
    final bytes = utf8.encode(url);
    return md5.convert(bytes).toString();
  }

  /// Check if audio is cached locally
  Future<bool> isAudioCached(String bookId) async {
    await initialize();

    final localPath = _getLocalPath(bookId);
    final file = File(localPath);

    return await file.exists();
  }

  /// Get the local path for cached audio (returns null if not cached)
  Future<String?> getCachedAudioPath(String bookId) async {
    await initialize();

    final localPath = _getLocalPath(bookId);
    final file = File(localPath);

    if (await file.exists()) {
      return localPath;
    }

    return null;
  }

  /// Download and cache audio file
  /// Returns the local file path on success, null on failure
  Future<String?> cacheAudio({
    required String bookId,
    required String audioUrl,
    Function(double progress)? onProgress,
  }) async {
    await initialize();

    if (audioUrl.isEmpty) return null;

    final localPath = _getLocalPath(bookId);
    final file = File(localPath);

    // Check if already cached
    if (await file.exists()) {
      return localPath;
    }

    try {
      // Download the audio file
      await _dio.download(
        audioUrl,
        localPath,
        onReceiveProgress: (received, total) {
          if (total > 0 && onProgress != null) {
            onProgress(received / total);
          }
        },
      );

      // Save cache metadata
      await _cacheBox.put(bookId, {
        'bookId': bookId,
        'localPath': localPath,
        'cachedAt': DateTime.now().toIso8601String(),
        'originalUrl': audioUrl,
      });

      return localPath;
    } catch (e) {
      // Clean up partial download
      if (await file.exists()) {
        await file.delete();
      }
      return null;
    }
  }

  /// Remove cached audio for a specific book
  Future<void> removeCachedAudio(String bookId) async {
    await initialize();

    final localPath = _getLocalPath(bookId);
    final file = File(localPath);

    if (await file.exists()) {
      await file.delete();
    }

    await _cacheBox.delete(bookId);
  }

  /// Clear all cached audio files
  Future<void> clearAllCache() async {
    await initialize();

    // Delete all files in cache directory
    if (await _cacheDirectory.exists()) {
      final files = await _cacheDirectory.list().toList();
      for (final file in files) {
        if (file is File) {
          await file.delete();
        }
      }
    }

    // Clear metadata
    await _cacheBox.clear();
  }

  /// Get total cache size in bytes
  Future<int> getCacheSize() async {
    await initialize();

    int totalSize = 0;

    if (await _cacheDirectory.exists()) {
      final files = await _cacheDirectory.list().toList();
      for (final file in files) {
        if (file is File) {
          totalSize += await file.length();
        }
      }
    }

    return totalSize;
  }

  /// Get cache size formatted as string
  Future<String> getFormattedCacheSize() async {
    final bytes = await getCacheSize();

    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
    }
  }

  /// Get number of cached audio files
  Future<int> getCachedCount() async {
    await initialize();
    return _cacheBox.length;
  }

  /// Get list of all cached book IDs
  Future<List<String>> getCachedBookIds() async {
    await initialize();
    return _cacheBox.keys.cast<String>().toList();
  }

  /// Dispose resources
  Future<void> dispose() async {
    if (_isInitialized) {
      await _cacheBox.close();
    }
  }
}
