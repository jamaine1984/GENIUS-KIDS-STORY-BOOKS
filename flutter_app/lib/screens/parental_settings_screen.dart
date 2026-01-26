/// Parental Settings Screen for Kids Storybook
/// Allows parents to manage app settings
/// Protected by parental gate - no child access

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/audio_cache_service.dart';
import '../main.dart';

class ParentalSettingsScreen extends StatefulWidget {
  const ParentalSettingsScreen({super.key});

  @override
  State<ParentalSettingsScreen> createState() => _ParentalSettingsScreenState();
}

class _ParentalSettingsScreenState extends State<ParentalSettingsScreen> {
  bool _isClearingCache = false;
  String? _cacheSize;

  @override
  void initState() {
    super.initState();
    _loadCacheSize();
  }

  Future<void> _loadCacheSize() async {
    final cacheService = context.read<AudioCacheService>();
    final size = await cacheService.getCacheSize();
    if (mounted) {
      setState(() => _cacheSize = _formatBytes(size));
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    }
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  Future<void> _clearCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Clear Audio Cache'),
        content: const Text(
          'This will remove all downloaded audio files. '
          'Audio will be downloaded again when needed.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isClearingCache = true);

      try {
        final cacheService = context.read<AudioCacheService>();
        await cacheService.clearAllCache();
        await _loadCacheSize();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Audio cache cleared'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not clear cache'),
              backgroundColor: Colors.red,
            ),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isClearingCache = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppConstants.backgroundColor,
      appBar: AppBar(
        title: const Text('Parent Settings'),
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.paddingMedium),
          children: [
            // Storage section
            _buildSectionHeader('Storage'),
            _buildSettingsCard(
              children: [
                _buildSettingsTile(
                  icon: Icons.storage_rounded,
                  title: 'Audio Cache',
                  subtitle: _cacheSize ?? 'Calculating...',
                  trailing: _isClearingCache
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : TextButton(
                          onPressed: _clearCache,
                          child: const Text('Clear'),
                        ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Privacy section
            _buildSectionHeader('Privacy and Safety'),
            _buildSettingsCard(
              children: [
                _buildSettingsTile(
                  icon: Icons.shield_rounded,
                  title: 'Data Collection',
                  subtitle: 'This app does not collect any data',
                  trailing: const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                  ),
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.block_rounded,
                  title: 'Advertisements',
                  subtitle: 'This app has no ads',
                  trailing: const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                  ),
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.analytics_rounded,
                  title: 'Analytics',
                  subtitle: 'No tracking or analytics',
                  trailing: const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                  ),
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.link_off_rounded,
                  title: 'External Links',
                  subtitle: 'No links outside the app',
                  trailing: const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // About section
            _buildSectionHeader('About'),
            _buildSettingsCard(
              children: [
                _buildSettingsTile(
                  icon: Icons.info_rounded,
                  title: 'App Version',
                  subtitle: AppConstants.appVersion,
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.child_care_rounded,
                  title: 'Designed For',
                  subtitle: 'Children ages 3-12',
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.verified_user_rounded,
                  title: 'COPPA Compliant',
                  subtitle: 'Safe for children',
                  trailing: const Icon(
                    Icons.check_circle,
                    color: Colors.green,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Content info section
            _buildSectionHeader('Content Information'),
            _buildSettingsCard(
              children: [
                _buildSettingsTile(
                  icon: Icons.auto_stories_rounded,
                  title: 'Story Content',
                  subtitle: 'All stories are age-appropriate and educational',
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.record_voice_over_rounded,
                  title: 'Audio Narration',
                  subtitle: 'Professional quality voice reading',
                ),
                const Divider(height: 1),
                _buildSettingsTile(
                  icon: Icons.palette_rounded,
                  title: 'Illustrations',
                  subtitle: 'Colorful, child-friendly artwork',
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Privacy notice
            Container(
              padding: const EdgeInsets.all(AppConstants.paddingMedium),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
                border: Border.all(
                  color: Colors.blue.withOpacity(0.3),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.privacy_tip_rounded,
                        color: Colors.blue[700],
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Privacy Notice',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[700],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Genius Kids Story Books is designed with your child\'s safety in mind. '
                    'We do not collect, store, or share any personal information. '
                    'All content is stored locally on this device. '
                    'There are no in-app purchases, advertisements, or external links.',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.grey[600],
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildSettingsCard({required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppConstants.radiusMedium),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppConstants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: AppConstants.primaryColor,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }
}
