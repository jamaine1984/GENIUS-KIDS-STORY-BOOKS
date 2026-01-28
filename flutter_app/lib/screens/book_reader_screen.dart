/// Book Reader Screen for Kids Storybook
/// Displays story pages with images and audio narration
/// No tracking, no ads - safe for kids

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/book.dart';
import '../services/audio_player_service.dart';
import '../main.dart';

class BookReaderScreen extends StatefulWidget {
  final Book book;

  const BookReaderScreen({super.key, required this.book});

  @override
  State<BookReaderScreen> createState() => _BookReaderScreenState();
}

class _BookReaderScreenState extends State<BookReaderScreen> {
  late PageController _pageController;
  int _currentPage = 0;
  bool _showControls = true;
  bool _autoPlayEnabled = true;
  bool _bookCompleted = false;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();

    // Setup auto-advance callback
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final audioService = context.read<AudioPlayerService>();
      audioService.onPageAudioComplete = _onPageAudioComplete;

      // Auto-play first page
      if (_autoPlayEnabled && widget.book.hasAudio) {
        _playCurrentPageAudio();
      }
    });
  }

  void _onPageAudioComplete(int completedPageIndex) {
    // Auto-advance to next page when audio finishes
    if (_autoPlayEnabled && completedPageIndex == _currentPage) {
      if (_currentPage < widget.book.pages.length - 1) {
        // Small delay before turning page
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            _nextPage();
            // Play next page audio after page turn
            Future.delayed(const Duration(milliseconds: 500), () {
              if (mounted && _autoPlayEnabled) {
                _playCurrentPageAudio();
              }
            });
          }
        });
      }
    }
  }

  void _playCurrentPageAudio() {
    final audioService = context.read<AudioPlayerService>();
    audioService.playPageAudio(widget.book, _currentPage);
  }

  @override
  void dispose() {
    // Clear callback and stop audio when leaving
    final audioService = context.read<AudioPlayerService>();
    audioService.onPageAudioComplete = null;
    audioService.stop();
    _pageController.dispose();
    super.dispose();
  }

  void _goToPage(int page) {
    if (page >= 0 && page < widget.book.pages.length) {
      _pageController.animateToPage(
        page,
        duration: AppConstants.animationMedium,
        curve: Curves.easeInOut,
      );
    }

    // Mark book as completed when user reaches the last page
    if (page == widget.book.pages.length - 1 && !_bookCompleted) {
      _bookCompleted = true;
    }
  }

  void _nextPage() {
    if (_currentPage < widget.book.pages.length - 1) {
      _goToPage(_currentPage + 1);
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _goToPage(_currentPage - 1);
    }
  }

  void _toggleControls() {
    setState(() => _showControls = !_showControls);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            // Page content
            GestureDetector(
              onTap: _toggleControls,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (page) {
                  setState(() => _currentPage = page);
                  // Play audio for the new page when manually swiping
                  if (_autoPlayEnabled && widget.book.hasAudio) {
                    _playCurrentPageAudio();
                  }
                  // Mark book as completed when user reaches the last page
                  if (page == widget.book.pages.length - 1 && !_bookCompleted) {
                    _bookCompleted = true;
                  }
                },
                itemCount: widget.book.pages.length,
                itemBuilder: (context, index) {
                  return _BookPage(
                    page: widget.book.pages[index],
                    pageNumber: index + 1,
                    totalPages: widget.book.pages.length,
                  );
                },
              ),
            ),

            // Top controls (back button and title)
            AnimatedPositioned(
              duration: AppConstants.animationFast,
              top: _showControls ? 0 : -100,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    // Back button
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(_bookCompleted),
                      icon: const Icon(
                        Icons.arrow_back_rounded,
                        color: Colors.white,
                        size: 32,
                      ),
                    ),
                    const SizedBox(width: 8),

                    // Title
                    Expanded(
                      child: Text(
                        widget.book.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    // Page indicator
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        '${_currentPage + 1} / ${widget.book.pages.length}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom controls (navigation and audio)
            AnimatedPositioned(
              duration: AppConstants.animationFast,
              bottom: _showControls ? 0 : -150,
              left: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(AppConstants.paddingMedium),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withOpacity(0.8),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Audio player
                    if (widget.book.hasAudio)
                      _AudioPlayerWidget(
                        book: widget.book,
                        currentPage: _currentPage,
                        autoPlayEnabled: _autoPlayEnabled,
                        onAutoPlayToggle: () {
                          setState(() => _autoPlayEnabled = !_autoPlayEnabled);
                        },
                        onPlayPage: _playCurrentPageAudio,
                      ),

                    const SizedBox(height: 16),

                    // Navigation buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        // Previous page
                        _NavigationButton(
                          icon: Icons.arrow_back_ios_rounded,
                          label: 'Back',
                          onTap: _currentPage > 0 ? _previousPage : null,
                        ),

                        // Page dots
                        _PageDots(
                          totalPages: widget.book.pages.length,
                          currentPage: _currentPage,
                          onTap: _goToPage,
                        ),

                        // Next page
                        _NavigationButton(
                          icon: Icons.arrow_forward_ios_rounded,
                          label: 'Next',
                          onTap: _currentPage < widget.book.pages.length - 1
                              ? _nextPage
                              : null,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Single book page widget
class _BookPage extends StatelessWidget {
  final BookPage page;
  final int pageNumber;
  final int totalPages;

  const _BookPage({
    required this.page,
    required this.pageNumber,
    required this.totalPages,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFFFFBF5), // Warm paper color
      child: Column(
        children: [
          // Image
          Expanded(
            flex: 3,
            child: page.imageUrl.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: page.imageUrl,
                    fit: BoxFit.contain,
                    placeholder: (context, url) => const Center(
                      child: CircularProgressIndicator(),
                    ),
                    errorWidget: (context, url, error) => Container(
                      color: Colors.grey[200],
                      child: const Center(
                        child: Text('🖼️', style: TextStyle(fontSize: 64)),
                      ),
                    ),
                  )
                : Container(
                    color: Colors.grey[200],
                    child: const Center(
                      child: Text('🖼️', style: TextStyle(fontSize: 64)),
                    ),
                  ),
          ),

          // Text
          Expanded(
            flex: 2,
            child: Container(
              padding: const EdgeInsets.all(AppConstants.paddingLarge),
              child: Center(
                child: Text(
                  page.text,
                  style: const TextStyle(
                    fontSize: 22,
                    height: 1.6,
                    color: Color(0xFF2D2D2D),
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Audio player widget
class _AudioPlayerWidget extends StatelessWidget {
  final Book book;
  final int currentPage;
  final bool autoPlayEnabled;
  final VoidCallback onAutoPlayToggle;
  final VoidCallback onPlayPage;

  const _AudioPlayerWidget({
    required this.book,
    required this.currentPage,
    required this.autoPlayEnabled,
    required this.onAutoPlayToggle,
    required this.onPlayPage,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<AudioPlayerService>(
      builder: (context, audioService, child) {
        final isCurrentBook = audioService.currentBookId == book.bookId;
        final isCurrentPage = isCurrentBook && audioService.currentPageIndex == currentPage;
        final isPlaying = isCurrentPage && audioService.isPlaying;
        final isLoading = isCurrentPage && audioService.isLoading;

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
          ),
          child: Row(
            children: [
              // Play/Pause button
              GestureDetector(
                onTap: () async {
                  if (isLoading) return;

                  if (isPlaying) {
                    await audioService.pause();
                  } else if (isCurrentPage && audioService.isPaused) {
                    await audioService.resume();
                  } else {
                    onPlayPage();
                  }
                },
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: AppConstants.primaryColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppConstants.primaryColor.withOpacity(0.4),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: isLoading
                      ? const Padding(
                          padding: EdgeInsets.all(16),
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Icon(
                          isPlaying
                              ? Icons.pause_rounded
                              : Icons.play_arrow_rounded,
                          color: Colors.white,
                          size: 32,
                        ),
                ),
              ),

              const SizedBox(width: 16),

              // Progress bar and info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Label with page info
                    Text(
                      isPlaying
                          ? 'Reading page ${currentPage + 1}...'
                          : 'Tap to read this page',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Progress bar
                    if (isCurrentPage)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: audioService.progress,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            AppConstants.accentColor,
                          ),
                          minHeight: 6,
                        ),
                      )
                    else
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: 0,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          minHeight: 6,
                        ),
                      ),

                    const SizedBox(height: 4),

                    // Time
                    if (isCurrentPage)
                      Text(
                        '${audioService.positionString} / ${audioService.durationString}',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ),

              // Auto-play toggle
              GestureDetector(
                onTap: onAutoPlayToggle,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: autoPlayEnabled
                        ? AppConstants.accentColor.withOpacity(0.3)
                        : Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        autoPlayEnabled ? Icons.auto_stories : Icons.auto_stories_outlined,
                        color: autoPlayEnabled ? AppConstants.accentColor : Colors.white,
                        size: 24,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Auto',
                        style: TextStyle(
                          color: autoPlayEnabled ? AppConstants.accentColor : Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Navigation button widget
class _NavigationButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  const _NavigationButton({
    required this.icon,
    required this.label,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = onTap != null;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedOpacity(
        duration: AppConstants.animationFast,
        opacity: isEnabled ? 1.0 : 0.3,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.2),
            borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Page dots indicator
class _PageDots extends StatelessWidget {
  final int totalPages;
  final int currentPage;
  final Function(int) onTap;

  const _PageDots({
    required this.totalPages,
    required this.currentPage,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Show max 7 dots
    final maxDots = 7;
    final showDots = totalPages <= maxDots;

    if (showDots) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(totalPages, (index) {
          return GestureDetector(
            onTap: () => onTap(index),
            child: Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: index == currentPage
                    ? Colors.white
                    : Colors.white.withOpacity(0.3),
              ),
            ),
          );
        }),
      );
    } else {
      // Show page number for many pages
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          'Page ${currentPage + 1}',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }
  }
}
