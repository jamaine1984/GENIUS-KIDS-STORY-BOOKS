/// Subscription model for managing user subscription tiers
class Subscription {
  final SubscriptionTier tier;
  final SubscriptionPeriod period;
  final DateTime? startDate;
  final DateTime? expiryDate;
  final bool isActive;
  final int booksReadThisMonth;
  final DateTime? lastResetDate;

  Subscription({
    required this.tier,
    required this.period,
    this.startDate,
    this.expiryDate,
    this.isActive = false,
    this.booksReadThisMonth = 0,
    this.lastResetDate,
  });

  /// Check if user has reached book limit for the month
  bool get hasReachedLimit {
    if (tier == SubscriptionTier.unlimited) return false;
    if (tier == SubscriptionTier.free) return booksReadThisMonth >= 1;
    if (tier == SubscriptionTier.basic) return booksReadThisMonth >= 100;
    return false;
  }

  /// Get remaining books for this month
  int get remainingBooks {
    if (tier == SubscriptionTier.unlimited) return -1; // Unlimited
    if (tier == SubscriptionTier.free) return 1 - booksReadThisMonth;
    if (tier == SubscriptionTier.basic) return 100 - booksReadThisMonth;
    return 0;
  }

  /// Check if subscription is expired
  bool get isExpired {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  /// Check if user can read a book
  bool get canReadBook {
    if (!isActive || isExpired) return tier == SubscriptionTier.free && booksReadThisMonth < 1;
    return !hasReachedLimit;
  }

  /// Get price for the subscription
  String get price {
    switch (tier) {
      case SubscriptionTier.free:
        return 'Free';
      case SubscriptionTier.basic:
        return period == SubscriptionPeriod.monthly ? '\$2.99/month' : '\$29.99/year';
      case SubscriptionTier.unlimited:
        return period == SubscriptionPeriod.monthly ? '\$4.99/month' : '\$49.99/year';
    }
  }

  /// Get monthly savings for annual plan
  String get savings {
    if (period != SubscriptionPeriod.annual) return '';
    if (tier == SubscriptionTier.basic) return 'Save \$6 per year';
    if (tier == SubscriptionTier.unlimited) return 'Save \$10 per year';
    return '';
  }

  factory Subscription.fromMap(Map<String, dynamic> map) {
    return Subscription(
      tier: SubscriptionTier.values.firstWhere(
        (e) => e.toString() == 'SubscriptionTier.${map['tier']}',
        orElse: () => SubscriptionTier.free,
      ),
      period: SubscriptionPeriod.values.firstWhere(
        (e) => e.toString() == 'SubscriptionPeriod.${map['period']}',
        orElse: () => SubscriptionPeriod.monthly,
      ),
      startDate: map['startDate'] != null ? DateTime.parse(map['startDate']) : null,
      expiryDate: map['expiryDate'] != null ? DateTime.parse(map['expiryDate']) : null,
      isActive: map['isActive'] ?? false,
      booksReadThisMonth: map['booksReadThisMonth'] ?? 0,
      lastResetDate: map['lastResetDate'] != null ? DateTime.parse(map['lastResetDate']) : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'tier': tier.name,
      'period': period.name,
      'startDate': startDate?.toIso8601String(),
      'expiryDate': expiryDate?.toIso8601String(),
      'isActive': isActive,
      'booksReadThisMonth': booksReadThisMonth,
      'lastResetDate': lastResetDate?.toIso8601String(),
    };
  }

  Subscription copyWith({
    SubscriptionTier? tier,
    SubscriptionPeriod? period,
    DateTime? startDate,
    DateTime? expiryDate,
    bool? isActive,
    int? booksReadThisMonth,
    DateTime? lastResetDate,
  }) {
    return Subscription(
      tier: tier ?? this.tier,
      period: period ?? this.period,
      startDate: startDate ?? this.startDate,
      expiryDate: expiryDate ?? this.expiryDate,
      isActive: isActive ?? this.isActive,
      booksReadThisMonth: booksReadThisMonth ?? this.booksReadThisMonth,
      lastResetDate: lastResetDate ?? this.lastResetDate,
    );
  }

  /// Create a free subscription (default)
  factory Subscription.free() {
    return Subscription(
      tier: SubscriptionTier.free,
      period: SubscriptionPeriod.monthly,
      isActive: true,
      booksReadThisMonth: 0,
      lastResetDate: DateTime.now(),
    );
  }
}

enum SubscriptionTier {
  free,
  basic,
  unlimited,
}

enum SubscriptionPeriod {
  monthly,
  annual,
}

extension SubscriptionTierExtension on SubscriptionTier {
  String get displayName {
    switch (this) {
      case SubscriptionTier.free:
        return 'Free';
      case SubscriptionTier.basic:
        return 'Basic';
      case SubscriptionTier.unlimited:
        return 'Unlimited';
    }
  }

  String get description {
    switch (this) {
      case SubscriptionTier.free:
        return '1 book to try the app';
      case SubscriptionTier.basic:
        return 'Up to 100 books per month';
      case SubscriptionTier.unlimited:
        return 'Unlimited books';
    }
  }

  List<String> get features {
    switch (this) {
      case SubscriptionTier.free:
        return [
          '1 book access',
          'Preview app features',
          'No credit card required',
        ];
      case SubscriptionTier.basic:
        return [
          '100 books per month',
          'Parent dashboard',
          'Sticker rewards',
          'Reading streaks',
          'Offline mode',
          'Up to 5 child profiles',
          'No ads',
        ];
      case SubscriptionTier.unlimited:
        return [
          'UNLIMITED books',
          'Parent dashboard',
          'Sticker rewards',
          'Reading streaks',
          'Offline mode',
          'Up to 5 child profiles',
          'No ads',
          'Perfect for families',
        ];
    }
  }
}
