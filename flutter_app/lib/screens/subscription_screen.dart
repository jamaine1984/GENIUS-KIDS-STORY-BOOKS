import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/subscription.dart';
import '../services/subscription_service.dart';

class SubscriptionScreen extends StatefulWidget {
  final bool showCloseButton;

  const SubscriptionScreen({
    super.key,
    this.showCloseButton = true,
  });

  @override
  State<SubscriptionScreen> createState() => _SubscriptionScreenState();
}

class _SubscriptionScreenState extends State<SubscriptionScreen> {
  SubscriptionTier _selectedTier = SubscriptionTier.unlimited;
  SubscriptionPeriod _selectedPeriod = SubscriptionPeriod.monthly;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    final subscriptionService = Provider.of<SubscriptionService>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: widget.showCloseButton
          ? AppBar(
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: IconButton(
                icon: const Icon(Icons.close, color: Colors.black87),
                onPressed: () => Navigator.of(context).pop(),
              ),
            )
          : null,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              const Text(
                'Choose Your Plan',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              const Text(
                'Start your child\'s reading journey today!',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.black54,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),

              // Period Toggle (Monthly/Annual)
              Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.all(4),
                child: Row(
                  children: [
                    Expanded(
                      child: _PeriodButton(
                        label: 'Monthly',
                        isSelected: _selectedPeriod == SubscriptionPeriod.monthly,
                        onTap: () {
                          setState(() {
                            _selectedPeriod = SubscriptionPeriod.monthly;
                          });
                        },
                      ),
                    ),
                    Expanded(
                      child: _PeriodButton(
                        label: 'Annual (Save 17%)',
                        isSelected: _selectedPeriod == SubscriptionPeriod.annual,
                        onTap: () {
                          setState(() {
                            _selectedPeriod = SubscriptionPeriod.annual;
                          });
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Basic Plan Card
              _SubscriptionCard(
                tier: SubscriptionTier.basic,
                period: _selectedPeriod,
                isSelected: _selectedTier == SubscriptionTier.basic,
                onTap: () {
                  setState(() {
                    _selectedTier = SubscriptionTier.basic;
                  });
                },
              ),
              const SizedBox(height: 16),

              // Unlimited Plan Card (Popular)
              Stack(
                children: [
                  _SubscriptionCard(
                    tier: SubscriptionTier.unlimited,
                    period: _selectedPeriod,
                    isSelected: _selectedTier == SubscriptionTier.unlimited,
                    onTap: () {
                      setState(() {
                        _selectedTier = SubscriptionTier.unlimited;
                      });
                    },
                  ),
                  Positioned(
                    top: 0,
                    right: 24,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.orange,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'MOST POPULAR',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Subscribe Button
              ElevatedButton(
                onPressed: _isProcessing ? null : _handleSubscribe,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6C63FF),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: _isProcessing
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Text(
                        _getSubscribeButtonText(),
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
              const SizedBox(height: 16),

              // Restore Purchases
              TextButton(
                onPressed: () async {
                  await subscriptionService.restorePurchases();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Purchases restored')),
                    );
                  }
                },
                child: const Text(
                  'Restore Purchases',
                  style: TextStyle(color: Colors.black54),
                ),
              ),
              const SizedBox(height: 24),

              // Features
              const Text(
                'All Plans Include:',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 12),
              ..._buildFeaturesList(),
              const SizedBox(height: 24),

              // Terms
              const Text(
                'Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage your subscription in App Store settings.',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.black38,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getSubscribeButtonText() {
    final price = _selectedTier == SubscriptionTier.basic
        ? (_selectedPeriod == SubscriptionPeriod.monthly ? '\$2.99/mo' : '\$29.99/yr')
        : (_selectedPeriod == SubscriptionPeriod.monthly ? '\$4.99/mo' : '\$49.99/yr');

    return 'Start ${_selectedTier.displayName} Plan - $price';
  }

  Future<void> _handleSubscribe() async {
    setState(() {
      _isProcessing = true;
    });

    try {
      // TODO: Implement actual In-App Purchase flow
      // For now, simulate the purchase
      final subscriptionService = Provider.of<SubscriptionService>(context, listen: false);
      await subscriptionService.simulatePurchase(_selectedTier, _selectedPeriod);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Welcome to ${_selectedTier.displayName} plan!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }
  }

  List<Widget> _buildFeaturesList() {
    return [
      _FeatureItem(icon: Icons.book, text: 'Beautiful illustrated stories'),
      _FeatureItem(icon: Icons.volume_up, text: 'Audio narration'),
      _FeatureItem(icon: Icons.star, text: 'Sticker rewards & achievements'),
      _FeatureItem(icon: Icons.dashboard, text: 'Parent dashboard'),
      _FeatureItem(icon: Icons.offline_bolt, text: 'Offline reading mode'),
      _FeatureItem(icon: Icons.family_restroom, text: 'Up to 5 child profiles'),
      _FeatureItem(icon: Icons.block, text: 'No ads, COPPA compliant'),
    ];
  }
}

class _PeriodButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PeriodButton({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? const Color(0xFF6C63FF) : Colors.black54,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _SubscriptionCard extends StatelessWidget {
  final SubscriptionTier tier;
  final SubscriptionPeriod period;
  final bool isSelected;
  final VoidCallback onTap;

  const _SubscriptionCard({
    required this.tier,
    required this.period,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final price = tier == SubscriptionTier.basic
        ? (period == SubscriptionPeriod.monthly ? '\$2.99' : '\$29.99')
        : (period == SubscriptionPeriod.monthly ? '\$4.99' : '\$49.99');

    final periodText = period == SubscriptionPeriod.monthly ? 'per month' : 'per year';
    final savings = period == SubscriptionPeriod.annual
        ? (tier == SubscriptionTier.basic ? 'Save \$6/year' : 'Save \$10/year')
        : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(
            color: isSelected ? const Color(0xFF6C63FF) : Colors.grey.shade300,
            width: isSelected ? 3 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [BoxShadow(color: const Color(0xFF6C63FF).withOpacity(0.2), blurRadius: 8)]
              : null,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tier.displayName,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    Text(
                      tier.description,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      price,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6C63FF),
                      ),
                    ),
                    Text(
                      periodText,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.black54,
                      ),
                    ),
                    if (savings != null)
                      Container(
                        margin: const EdgeInsets.only(top: 4),
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.green.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          savings,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.green.shade700,
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeatureItem({
    required this.icon,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF6C63FF)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
