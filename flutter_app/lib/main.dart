/// Kids Storybook Library
/// A safe, educational app for children to enjoy stories
///
/// Privacy and Safety:
/// - No tracking or analytics
/// - No ads
/// - No external links without parental gate
/// - No data collection
/// - All content is age-appropriate
/// - COPPA compliant

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'firebase_options.dart';
import 'services/audio_player_service.dart';
import 'services/book_service.dart';
import 'services/audio_cache_service.dart';
import 'services/subscription_service.dart';
import 'screens/home_screen.dart';
import 'screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait mode for kids
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize Hive for local storage
  await Hive.initFlutter();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const KidsStorybookApp());
}

class KidsStorybookApp extends StatelessWidget {
  const KidsStorybookApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Subscription service
        ChangeNotifierProvider<SubscriptionService>(
          create: (_) {
            final service = SubscriptionService();
            service.initialize();
            return service;
          },
        ),

        // Book service
        Provider<BookService>(
          create: (_) => BookService(),
        ),

        // Audio cache service
        Provider<AudioCacheService>(
          create: (_) => AudioCacheService(),
          dispose: (_, service) => service.dispose(),
        ),

        // Audio player service
        ChangeNotifierProvider<AudioPlayerService>(
          create: (context) {
            final service = AudioPlayerService(
              cacheService: context.read<AudioCacheService>(),
            );
            service.initialize();
            return service;
          },
        ),
      ],
      child: MaterialApp(
        title: 'Genius Kids Story Books',
        debugShowCheckedModeBanner: false,

        // Kid-friendly theme
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF6B4EFF),
            brightness: Brightness.light,
          ),
          fontFamily: 'Nunito',

          // Large, readable text for kids
          textTheme: const TextTheme(
            displayLarge: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
            displayMedium: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
            headlineLarge: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
            headlineMedium: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(0xFF2D2D2D),
            ),
            bodyLarge: TextStyle(
              fontSize: 18,
              color: Color(0xFF4A4A4A),
              height: 1.5,
            ),
            bodyMedium: TextStyle(
              fontSize: 16,
              color: Color(0xFF4A4A4A),
              height: 1.5,
            ),
          ),

          // Large touch targets for kids
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              minimumSize: const Size(64, 56),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),

          // Rounded cards
          cardTheme: const CardThemeData(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(20)),
            ),
          ),

          // App bar styling
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            backgroundColor: Colors.transparent,
            foregroundColor: Color(0xFF2D2D2D),
          ),
        ),

        home: const SplashScreen(),
      ),
    );
  }
}

/// App-wide constants
class AppConstants {
  // App information
  static const String appName = 'Genius Kids Story Books';
  static const String appVersion = '1.0.0';

  // Colors
  static const Color primaryColor = Color(0xFF6B4EFF);
  static const Color secondaryColor = Color(0xFFFF6B6B);
  static const Color accentColor = Color(0xFFFFD93D);
  static const Color backgroundColor = Color(0xFFF8F9FE);

  // Age range colors
  static const Color ages0to2Color = Color(0xFFFF6B9D);
  static const Color ages3to5Color = Color(0xFFFF9F43);
  static const Color ages6to8Color = Color(0xFF54A0FF);
  static const Color ages9to10Color = Color(0xFF5F27CD);

  // Spacing
  static const double paddingSmall = 8.0;
  static const double paddingMedium = 16.0;
  static const double paddingLarge = 24.0;
  static const double paddingExtraLarge = 32.0;

  // Border radius
  static const double radiusSmall = 8.0;
  static const double radiusMedium = 16.0;
  static const double radiusLarge = 24.0;

  // Animation durations
  static const Duration animationFast = Duration(milliseconds: 200);
  static const Duration animationMedium = Duration(milliseconds: 300);
  static const Duration animationSlow = Duration(milliseconds: 500);

  // No external URLs to prevent kids from leaving the app
  // All content is self-contained

  // Privacy - Important for App Store Kids Category
  static const bool collectsData = false;
  static const bool hasAds = false;
  static const bool hasTracking = false;
  static const bool hasExternalLinks = false;
}
