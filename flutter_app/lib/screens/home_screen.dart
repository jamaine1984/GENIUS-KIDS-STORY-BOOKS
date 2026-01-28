/// Home Screen for Kids Storybook
/// Shows book library organized by age and category
/// No tracking, no ads, no external links - safe for kids

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/book_service.dart';
import '../services/subscription_service.dart';
import '../models/book.dart';
import '../models/subscription.dart';
import '../main.dart';
import 'book_reader_screen.dart';
import 'parental_settings_screen.dart';
import 'subscription_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  AgeRange? _selectedAgeRange;
  List<Book> _books = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    setState(() => _isLoading = true);

    final bookService = context.read<BookService>();
    final books = await bookService.getBooks(
      ageRange: _selectedAgeRange,
      limit: 50,
    );

    if (mounted) {
      setState(() {
        _books = books;
        _isLoading = false;
      });
    }
  }

  void _selectAgeRange(AgeRange? ageRange) {
    setState(() => _selectedAgeRange = ageRange);
    _loadBooks();
  }

  void _openBook(Book book) async {
    final subscriptionService = context.read<SubscriptionService>();

    // Check if user can read this book
    if (!subscriptionService.canReadBook()) {
      // Show paywall
      _showSubscriptionPaywall();
      return;
    }

    // Open the book
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => BookReaderScreen(book: book),
      ),
    );

    // If book was completed, increment counter and show upgrade prompt if needed
    if (result == true && mounted) {
      await subscriptionService.incrementBooksRead();

      final upgradeMessage = subscriptionService.getUpgradeMessage();
      if (upgradeMessage != null && mounted) {
        _showUpgradePrompt(upgradeMessage);
      }
    }
  }

  void _showSubscriptionPaywall() {
    final subscriptionService = context.read<SubscriptionService>();
    final subscription = subscriptionService.subscription;

    String message;
    if (subscription.tier == SubscriptionTier.free) {
      message = 'You\'ve used your free book! Subscribe to keep reading amazing stories.';
    } else if (subscription.tier == SubscriptionTier.basic) {
      message = 'You\'ve reached your 100 book limit for this month! Upgrade to Unlimited to keep reading.';
    } else {
      message = 'Subscribe to read unlimited books!';
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Subscription Required'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Maybe Later'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const SubscriptionScreen(showCloseButton: true),
                ),
              );
            },
            child: const Text('Subscribe Now'),
          ),
        ],
      ),
    );
  }

  void _showUpgradePrompt(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        action: SnackBarAction(
          label: 'Upgrade',
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const SubscriptionScreen(showCloseButton: true),
              ),
            );
          },
        ),
        duration: const Duration(seconds: 5),
        backgroundColor: Colors.orange,
      ),
    );
  }

  void _openParentalSettings() {
    // Parental gate - simple math problem
    _showParentalGate(() {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => const ParentalSettingsScreen(),
        ),
      );
    });
  }

  void _showParentalGate(VoidCallback onSuccess) {
    // Generate random math problem for parental gate
    final num1 = 10 + (DateTime.now().millisecond % 10);
    final num2 = 5 + (DateTime.now().second % 10);
    final answer = num1 + num2;

    showDialog(
      context: context,
      builder: (context) => ParentalGateDialog(
        question: 'What is $num1 + $num2?',
        correctAnswer: answer.toString(),
        onSuccess: () {
          Navigator.of(context).pop();
          onSuccess();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            _buildHeader(),

            // Age filter
            _buildAgeFilter(),

            // Book grid
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _books.isEmpty
                      ? _buildEmptyState()
                      : _buildBookGrid(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(AppConstants.paddingMedium),
      child: Column(
        children: [
          Row(
            children: [
              // App title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '📚 Genius Kids',
                      style: Theme.of(context).textTheme.headlineLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Choose a story to read!',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                    ),
                  ],
                ),
              ),

              // Subscription button
              Consumer<SubscriptionService>(
                builder: (context, subscriptionService, child) {
                  if (!subscriptionService.isInitialized) {
                    return const SizedBox.shrink();
                  }

                  final subscription = subscriptionService.subscription;
                  final isUnlimited = subscription.tier == SubscriptionTier.unlimited;

                  return IconButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => const SubscriptionScreen(showCloseButton: true),
                        ),
                      );
                    },
                    icon: Icon(
                      isUnlimited ? Icons.stars : Icons.workspace_premium,
                      size: 28,
                      color: isUnlimited ? Colors.amber : AppConstants.primaryColor,
                    ),
                    tooltip: 'Subscription',
                  );
                },
              ),

              // Parental settings button (hidden from kids)
              IconButton(
                onPressed: _openParentalSettings,
                icon: const Icon(Icons.settings, size: 28),
                tooltip: 'Settings',
              ),
            ],
          ),

          // Subscription status banner
          Consumer<SubscriptionService>(
            builder: (context, subscriptionService, child) {
              if (!subscriptionService.isInitialized) {
                return const SizedBox.shrink();
              }

              final subscription = subscriptionService.subscription;
              final remainingBooks = subscription.remainingBooks;

              // Don't show for unlimited users
              if (remainingBooks == -1) {
                return const SizedBox.shrink();
              }

              String message;
              Color backgroundColor;

              if (subscription.tier == SubscriptionTier.free) {
                message = remainingBooks > 0
                    ? '📖 $remainingBooks free book available'
                    : '✨ Subscribe to read unlimited stories!';
                backgroundColor = remainingBooks > 0 ? Colors.blue : Colors.orange;
              } else {
                message = '$remainingBooks of 100 books left this month';
                backgroundColor = remainingBooks < 20 ? Colors.orange : Colors.green;
              }

              return Container(
                margin: const EdgeInsets.only(top: 12),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: backgroundColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: backgroundColor.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        message,
                        style: TextStyle(
                          color: backgroundColor.withOpacity(0.9),
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (remainingBooks <= 0 || (remainingBooks < 20 && remainingBooks != -1))
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => const SubscriptionScreen(showCloseButton: true),
                            ),
                          );
                        },
                        child: Text(
                          remainingBooks <= 0 ? 'Subscribe' : 'Upgrade',
                          style: TextStyle(
                            color: backgroundColor,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAgeFilter() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(
        horizontal: AppConstants.paddingMedium,
      ),
      child: Row(
        children: [
          // All books
          _AgeFilterChip(
            label: 'All Stories',
            emoji: '📖',
            color: AppConstants.primaryColor,
            isSelected: _selectedAgeRange == null,
            onTap: () => _selectAgeRange(null),
          ),
          const SizedBox(width: 12),

          // Age 0-2
          _AgeFilterChip(
            label: 'Ages 0-2',
            emoji: '👶',
            color: AppConstants.ages0to2Color,
            isSelected: _selectedAgeRange == AgeRange.ages0to2,
            onTap: () => _selectAgeRange(AgeRange.ages0to2),
          ),
          const SizedBox(width: 12),

          // Age 3-5
          _AgeFilterChip(
            label: 'Ages 3-5',
            emoji: '🐣',
            color: AppConstants.ages3to5Color,
            isSelected: _selectedAgeRange == AgeRange.ages3to5,
            onTap: () => _selectAgeRange(AgeRange.ages3to5),
          ),
          const SizedBox(width: 12),

          // Age 6-8
          _AgeFilterChip(
            label: 'Ages 6-8',
            emoji: '🌟',
            color: AppConstants.ages6to8Color,
            isSelected: _selectedAgeRange == AgeRange.ages6to8,
            onTap: () => _selectAgeRange(AgeRange.ages6to8),
          ),
          const SizedBox(width: 12),

          // Age 9-10
          _AgeFilterChip(
            label: 'Ages 9-10',
            emoji: '🚀',
            color: AppConstants.ages9to10Color,
            isSelected: _selectedAgeRange == AgeRange.ages9to10,
            onTap: () => _selectAgeRange(AgeRange.ages9to10),
          ),
        ],
      ),
    );
  }

  Widget _buildBookGrid() {
    return RefreshIndicator(
      onRefresh: _loadBooks,
      child: GridView.builder(
        padding: const EdgeInsets.all(AppConstants.paddingMedium),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.7,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: _books.length,
        itemBuilder: (context, index) {
          return _BookCard(
            book: _books[index],
            onTap: () => _openBook(_books[index]),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            '📚',
            style: TextStyle(fontSize: 64),
          ),
          const SizedBox(height: 16),
          Text(
            'No stories yet!',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Check back soon for new stories.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
        ],
      ),
    );
  }
}

/// Age filter chip widget
class _AgeFilterChip extends StatelessWidget {
  final String label;
  final String emoji;
  final Color color;
  final bool isSelected;
  final VoidCallback onTap;

  const _AgeFilterChip({
    required this.label,
    required this.emoji,
    required this.color,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: AppConstants.animationFast,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.white,
          borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? color.withOpacity(0.4)
                  : Colors.black.withOpacity(0.1),
              blurRadius: isSelected ? 12 : 6,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(emoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : Colors.grey[800],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Book card widget
class _BookCard extends StatelessWidget {
  final Book book;
  final VoidCallback onTap;

  const _BookCard({
    required this.book,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(AppConstants.radiusLarge),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Cover image
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppConstants.radiusLarge),
                ),
                child: book.coverImageUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: book.coverImageUrl,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: Colors.grey[200],
                          child: const Center(
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: Colors.grey[200],
                          child: const Center(
                            child: Text('📚', style: TextStyle(fontSize: 48)),
                          ),
                        ),
                      )
                    : Container(
                        color: _getAgeColor(book.ageRange),
                        child: const Center(
                          child: Text('📚', style: TextStyle(fontSize: 48)),
                        ),
                      ),
              ),
            ),

            // Book info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Expanded(
                      child: Text(
                        book.title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          height: 1.2,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                    const SizedBox(height: 4),

                    // Age badge and audio indicator
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: _getAgeColor(book.ageRange).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            book.ageRange.displayName,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: _getAgeColor(book.ageRange),
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (book.hasAudio)
                          const Icon(
                            Icons.volume_up,
                            size: 16,
                            color: Colors.green,
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

  Color _getAgeColor(AgeRange ageRange) {
    switch (ageRange) {
      case AgeRange.ages0to2:
        return AppConstants.ages0to2Color;
      case AgeRange.ages3to5:
        return AppConstants.ages3to5Color;
      case AgeRange.ages6to8:
        return AppConstants.ages6to8Color;
      case AgeRange.ages9to10:
        return AppConstants.ages9to10Color;
    }
  }
}

/// Parental gate dialog
class ParentalGateDialog extends StatefulWidget {
  final String question;
  final String correctAnswer;
  final VoidCallback onSuccess;

  const ParentalGateDialog({
    super.key,
    required this.question,
    required this.correctAnswer,
    required this.onSuccess,
  });

  @override
  State<ParentalGateDialog> createState() => _ParentalGateDialogState();
}

class _ParentalGateDialogState extends State<ParentalGateDialog> {
  final _controller = TextEditingController();
  bool _showError = false;

  void _checkAnswer() {
    if (_controller.text.trim() == widget.correctAnswer) {
      widget.onSuccess();
    } else {
      setState(() => _showError = true);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      title: const Text('Parent Check'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Please answer this question to continue:',
            style: TextStyle(fontSize: 14),
          ),
          const SizedBox(height: 16),
          Text(
            widget.question,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 24),
            decoration: InputDecoration(
              hintText: 'Answer',
              errorText: _showError ? 'Incorrect answer' : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onSubmitted: (_) => _checkAnswer(),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _checkAnswer,
          child: const Text('Submit'),
        ),
      ],
    );
  }
}
