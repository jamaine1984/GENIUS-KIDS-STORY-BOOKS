import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/subscription.dart';

/// Service for managing user subscriptions
class SubscriptionService extends ChangeNotifier {
  static final SubscriptionService _instance = SubscriptionService._internal();
  factory SubscriptionService() => _instance;
  SubscriptionService._internal();

  Subscription _subscription = Subscription.free();
  Subscription get subscription => _subscription;

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  /// Initialize the subscription service
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTier = prefs.getString('subscription_tier');
      final savedPeriod = prefs.getString('subscription_period');
      final savedStartDate = prefs.getString('subscription_start_date');
      final savedExpiryDate = prefs.getString('subscription_expiry_date');
      final savedIsActive = prefs.getBool('subscription_is_active') ?? false;
      final savedBooksRead = prefs.getInt('books_read_this_month') ?? 0;
      final savedLastReset = prefs.getString('subscription_last_reset');

      if (savedTier != null) {
        _subscription = Subscription(
          tier: SubscriptionTier.values.firstWhere(
            (e) => e.name == savedTier,
            orElse: () => SubscriptionTier.free,
          ),
          period: savedPeriod != null
              ? SubscriptionPeriod.values.firstWhere(
                  (e) => e.name == savedPeriod,
                  orElse: () => SubscriptionPeriod.monthly,
                )
              : SubscriptionPeriod.monthly,
          startDate: savedStartDate != null ? DateTime.parse(savedStartDate) : null,
          expiryDate: savedExpiryDate != null ? DateTime.parse(savedExpiryDate) : null,
          isActive: savedIsActive,
          booksReadThisMonth: savedBooksRead,
          lastResetDate: savedLastReset != null ? DateTime.parse(savedLastReset) : DateTime.now(),
        );

        // Check if we need to reset monthly counter
        await _checkAndResetMonthlyCounter();
      }

      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error initializing subscription service: $e');
      _subscription = Subscription.free();
      _isInitialized = true;
      notifyListeners();
    }
  }

  /// Check if monthly counter needs to be reset
  Future<void> _checkAndResetMonthlyCounter() async {
    if (_subscription.lastResetDate == null) return;

    final now = DateTime.now();
    final lastReset = _subscription.lastResetDate!;

    // Check if we're in a new month
    if (now.year > lastReset.year || now.month > lastReset.month) {
      _subscription = _subscription.copyWith(
        booksReadThisMonth: 0,
        lastResetDate: DateTime(now.year, now.month, 1),
      );
      await _saveSubscription();
    }
  }

  /// Save subscription to local storage
  Future<void> _saveSubscription() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('subscription_tier', _subscription.tier.name);
      await prefs.setString('subscription_period', _subscription.period.name);
      await prefs.setString('subscription_start_date', _subscription.startDate?.toIso8601String() ?? '');
      await prefs.setString('subscription_expiry_date', _subscription.expiryDate?.toIso8601String() ?? '');
      await prefs.setBool('subscription_is_active', _subscription.isActive);
      await prefs.setInt('books_read_this_month', _subscription.booksReadThisMonth);
      await prefs.setString('subscription_last_reset', _subscription.lastResetDate?.toIso8601String() ?? '');
    } catch (e) {
      debugPrint('Error saving subscription: $e');
    }
  }

  /// Update subscription tier (called after purchase)
  Future<void> updateSubscription({
    required SubscriptionTier tier,
    required SubscriptionPeriod period,
  }) async {
    final now = DateTime.now();
    final expiryDate = period == SubscriptionPeriod.monthly
        ? DateTime(now.year, now.month + 1, now.day)
        : DateTime(now.year + 1, now.month, now.day);

    _subscription = Subscription(
      tier: tier,
      period: period,
      startDate: now,
      expiryDate: expiryDate,
      isActive: true,
      booksReadThisMonth: _subscription.booksReadThisMonth,
      lastResetDate: _subscription.lastResetDate ?? DateTime(now.year, now.month, 1),
    );

    await _saveSubscription();
    notifyListeners();
  }

  /// Increment books read counter
  Future<void> incrementBooksRead() async {
    await _checkAndResetMonthlyCounter();

    _subscription = _subscription.copyWith(
      booksReadThisMonth: _subscription.booksReadThisMonth + 1,
    );

    await _saveSubscription();
    notifyListeners();
  }

  /// Check if user can read a book
  bool canReadBook() {
    return _subscription.canReadBook;
  }

  /// Get upgrade recommendation message
  String? getUpgradeMessage() {
    if (_subscription.tier == SubscriptionTier.free) {
      if (_subscription.booksReadThisMonth >= 1) {
        return 'You\'ve read your free book! Subscribe to keep reading.';
      }
    } else if (_subscription.tier == SubscriptionTier.basic) {
      if (_subscription.booksReadThisMonth >= 80) {
        return 'You\'ve read ${_subscription.booksReadThisMonth} of 100 books! Upgrade to Unlimited for just \$2 more.';
      } else if (_subscription.booksReadThisMonth >= 100) {
        return 'You\'ve reached your 100 book limit! Upgrade to Unlimited to keep reading.';
      }
    }
    return null;
  }

  /// Check if should show upgrade prompt
  bool shouldShowUpgradePrompt() {
    if (_subscription.tier == SubscriptionTier.free && _subscription.booksReadThisMonth >= 1) {
      return true;
    }
    if (_subscription.tier == SubscriptionTier.basic && _subscription.booksReadThisMonth >= 80) {
      return true;
    }
    return false;
  }

  /// Restore purchases (called when user taps "Restore Purchases")
  Future<void> restorePurchases() async {
    // TODO: Implement actual purchase restoration with App Store
    // For now, this is a placeholder
    debugPrint('Restore purchases called');
  }

  /// Cancel subscription
  Future<void> cancelSubscription() async {
    _subscription = Subscription.free();
    await _saveSubscription();
    notifyListeners();
  }

  /// For testing: simulate subscription purchase
  Future<void> simulatePurchase(SubscriptionTier tier, SubscriptionPeriod period) async {
    await updateSubscription(tier: tier, period: period);
  }
}
