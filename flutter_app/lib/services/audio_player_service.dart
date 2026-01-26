/// Audio Player Service for Kids Storybook
/// Plays audio from local cache or streams from storage
/// NEVER calls TTS API - only plays pre-generated audio
/// No tracking, no analytics - safe for kids

import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';
import '../models/book.dart';
import 'audio_cache_service.dart';

/// Playback state for the audio player
enum PlaybackState {
  stopped,
  loading,
  playing,
  paused,
  completed,
  error,
}

/// Audio player service with offline support
class AudioPlayerService extends ChangeNotifier {
  final AudioPlayer _player;
  final AudioCacheService _cacheService;

  PlaybackState _state = PlaybackState.stopped;
  String? _currentBookId;
  int _currentPageIndex = 0;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;
  double _playbackSpeed = 1.0;
  String? _errorMessage;

  // Callback for when page audio completes (for auto-advance)
  Function(int completedPageIndex)? onPageAudioComplete;

  StreamSubscription<PlayerState>? _playerStateSubscription;
  StreamSubscription<Duration>? _positionSubscription;
  StreamSubscription<Duration?>? _durationSubscription;

  AudioPlayerService({AudioCacheService? cacheService})
      : _player = AudioPlayer(),
        _cacheService = cacheService ?? AudioCacheService();

  // Getters
  PlaybackState get state => _state;
  String? get currentBookId => _currentBookId;
  int get currentPageIndex => _currentPageIndex;
  Duration get position => _position;
  Duration get duration => _duration;
  double get playbackSpeed => _playbackSpeed;
  String? get errorMessage => _errorMessage;

  bool get isPlaying => _state == PlaybackState.playing;
  bool get isPaused => _state == PlaybackState.paused;
  bool get isLoading => _state == PlaybackState.loading;
  bool get isStopped => _state == PlaybackState.stopped;

  double get progress {
    if (_duration.inMilliseconds == 0) return 0;
    return _position.inMilliseconds / _duration.inMilliseconds;
  }

  /// Initialize the audio player and session
  Future<void> initialize() async {
    await _cacheService.initialize();

    // Configure audio session for playback
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.speech());

    // Listen to player state changes
    _playerStateSubscription = _player.playerStateStream.listen((playerState) {
      if (playerState.processingState == ProcessingState.completed) {
        _state = PlaybackState.completed;
        notifyListeners();
        // Call the callback for auto-advance
        if (onPageAudioComplete != null) {
          onPageAudioComplete!(_currentPageIndex);
        }
      } else if (playerState.processingState == ProcessingState.loading ||
          playerState.processingState == ProcessingState.buffering) {
        _state = PlaybackState.loading;
        notifyListeners();
      } else if (playerState.playing) {
        _state = PlaybackState.playing;
        notifyListeners();
      } else {
        if (_state != PlaybackState.stopped && _state != PlaybackState.completed) {
          _state = PlaybackState.paused;
          notifyListeners();
        }
      }
    });

    // Listen to position updates
    _positionSubscription = _player.positionStream.listen((position) {
      _position = position;
      notifyListeners();
    });

    // Listen to duration updates
    _durationSubscription = _player.durationStream.listen((duration) {
      _duration = duration ?? Duration.zero;
      notifyListeners();
    });
  }

  /// Play audio for a book
  /// Uses cached audio if available, otherwise streams from URL
  Future<bool> playBook(Book book) async {
    if (!book.hasAudio) {
      _errorMessage = 'Audio is not available for this story';
      _state = PlaybackState.error;
      notifyListeners();
      return false;
    }

    try {
      _state = PlaybackState.loading;
      _currentBookId = book.bookId;
      _errorMessage = null;
      notifyListeners();

      // Check for cached audio first
      String? audioPath = await _cacheService.getCachedAudioPath(book.bookId);

      if (audioPath != null) {
        // Play from local cache
        await _player.setFilePath(audioPath);
      } else {
        // Stream from URL and cache in background
        await _player.setUrl(book.audio.publicUrl);

        // Cache for offline use (non-blocking)
        _cacheService.cacheAudio(
          bookId: book.bookId,
          audioUrl: book.audio.publicUrl,
        );
      }

      await _player.play();
      return true;
    } catch (e) {
      _errorMessage = 'Could not play the story audio';
      _state = PlaybackState.error;
      notifyListeners();
      return false;
    }
  }

  /// Play audio for a specific page
  Future<bool> playPageAudio(Book book, int pageIndex) async {
    if (pageIndex < 0 || pageIndex >= book.pages.length) {
      return false;
    }

    final page = book.pages[pageIndex];
    if (page.audioUrl.isEmpty) {
      _errorMessage = 'Audio is not available for this page';
      _state = PlaybackState.error;
      notifyListeners();
      return false;
    }

    try {
      _state = PlaybackState.loading;
      _currentBookId = book.bookId;
      _currentPageIndex = pageIndex;
      _errorMessage = null;
      notifyListeners();

      // Stream from URL
      await _player.setUrl(page.audioUrl);
      await _player.play();
      return true;
    } catch (e) {
      _errorMessage = 'Could not play the story audio';
      _state = PlaybackState.error;
      notifyListeners();
      return false;
    }
  }

  /// Pause playback
  Future<void> pause() async {
    await _player.pause();
  }

  /// Resume playback
  Future<void> resume() async {
    await _player.play();
  }

  /// Stop playback
  Future<void> stop() async {
    await _player.stop();
    _state = PlaybackState.stopped;
    _currentBookId = null;
    _position = Duration.zero;
    notifyListeners();
  }

  /// Seek to a specific position
  Future<void> seekTo(Duration position) async {
    await _player.seek(position);
  }

  /// Seek to a progress value (0.0 to 1.0)
  Future<void> seekToProgress(double progress) async {
    final position = Duration(
      milliseconds: (_duration.inMilliseconds * progress).round(),
    );
    await seekTo(position);
  }

  /// Skip forward by seconds
  Future<void> skipForward({int seconds = 10}) async {
    final newPosition = _position + Duration(seconds: seconds);
    if (newPosition < _duration) {
      await seekTo(newPosition);
    } else {
      await seekTo(_duration);
    }
  }

  /// Skip backward by seconds
  Future<void> skipBackward({int seconds = 10}) async {
    final newPosition = _position - Duration(seconds: seconds);
    if (newPosition > Duration.zero) {
      await seekTo(newPosition);
    } else {
      await seekTo(Duration.zero);
    }
  }

  /// Set playback speed (0.5 to 2.0)
  Future<void> setPlaybackSpeed(double speed) async {
    _playbackSpeed = speed.clamp(0.5, 2.0);
    await _player.setSpeed(_playbackSpeed);
    notifyListeners();
  }

  /// Toggle between play and pause
  Future<void> togglePlayPause() async {
    if (isPlaying) {
      await pause();
    } else if (isPaused || _state == PlaybackState.completed) {
      if (_state == PlaybackState.completed) {
        await seekTo(Duration.zero);
      }
      await resume();
    }
  }

  /// Format duration as string (MM:SS)
  String formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  /// Get formatted position string
  String get positionString => formatDuration(_position);

  /// Get formatted duration string
  String get durationString => formatDuration(_duration);

  /// Get formatted remaining time string
  String get remainingString {
    final remaining = _duration - _position;
    return '-${formatDuration(remaining)}';
  }

  /// Download audio for offline use
  Future<bool> downloadForOffline(Book book, {Function(double)? onProgress}) async {
    if (!book.hasAudio) return false;

    final path = await _cacheService.cacheAudio(
      bookId: book.bookId,
      audioUrl: book.audio.publicUrl,
      onProgress: onProgress,
    );

    return path != null;
  }

  /// Check if audio is cached
  Future<bool> isAudioCached(String bookId) async {
    return await _cacheService.isAudioCached(bookId);
  }

  /// Remove cached audio
  Future<void> removeCachedAudio(String bookId) async {
    await _cacheService.removeCachedAudio(bookId);
  }

  /// Clear all cached audio
  Future<void> clearAllCache() async {
    await _cacheService.clearAllCache();
  }

  /// Get cache size
  Future<String> getCacheSize() async {
    return await _cacheService.getFormattedCacheSize();
  }

  @override
  void dispose() {
    _playerStateSubscription?.cancel();
    _positionSubscription?.cancel();
    _durationSubscription?.cancel();
    _player.dispose();
    super.dispose();
  }
}
