import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/routing/app_router.dart';
import '../../../design_system/colors.dart';
import '../../../design_system/spacing.dart';
import '../../../design_system/typography.dart';
import '../../create_blan/models/category.dart';
import '../../create_blan/providers/categories_provider.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  bool _hasNavigated = false;
  Timer? _timeoutTimer;

  @override
  void initState() {
    super.initState();
    print('🚀 Splash: initState called');
    
    // Add timeout fallback - navigate after 5 seconds even if categories don't load
    _timeoutTimer = Timer(const Duration(seconds: 5), () {
        if (!_hasNavigated && mounted) {
          print('⏰ Splash: Timeout reached, navigating anyway...');
          _hasNavigated = true;
          if (context.mounted) {
            context.go(AppRoute.login.path);
          }
        }
    });
  }

  @override
  void dispose() {
    _timeoutTimer?.cancel();
    super.dispose();
  }

  void _checkAndNavigate(AsyncValue<List<Category>> categoriesAsync) {
    if (_hasNavigated) return;

    categoriesAsync.when(
      data: (categories) {
        if (!_hasNavigated) {
          _hasNavigated = true;
          _timeoutTimer?.cancel();
          print('✅ Splash: Categories loaded: ${categories.length} items');
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted && context.mounted) {
              print('🚀 Splash: Navigating to login...');
              context.go(AppRoute.login.path);
            }
          });
        }
      },
      loading: () {
        // Still loading
      },
      error: (error, stackTrace) {
        if (!_hasNavigated) {
          _hasNavigated = true;
          _timeoutTimer?.cancel();
          print('❌ Splash: Error loading categories: $error');
          print('   Stack trace: $stackTrace');
          Future.delayed(const Duration(milliseconds: 500), () {
            if (mounted && context.mounted) {
              print('🚀 Splash: Navigating despite error...');
              context.go(AppRoute.login.path);
            }
          });
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    // Listen to categories provider changes - must be called during build
    ref.listen<AsyncValue<List<Category>>>(
      categoriesProvider,
      (previous, next) {
        if (!_hasNavigated) {
          final prevCount = previous?.value?.length ?? 'null';
          final nextCount = next.value?.length ?? 'loading';
          print('👂 Splash: Listener triggered - previous: $prevCount, next: $nextCount');
          _checkAndNavigate(next);
        }
      },
    );

    // Check state directly (handles fast cache loads)
    // Use a microtask to avoid calling during build
    if (!_hasNavigated) {
      Future.microtask(() {
        if (mounted && !_hasNavigated) {
          _checkAndNavigate(categoriesAsync);
        }
      });
    }

    return Scaffold(
      backgroundColor: BlannerColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo/Icon
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: BlannerColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  'B',
                  style: BlannerTextStyles.headline1.copyWith(
                    color: BlannerColors.surface,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: BlannerSpacing.xl),
            // Loading indicator
            categoriesAsync.when(
              data: (_) => const SizedBox.shrink(), // Hide when loaded
              loading: () => const CircularProgressIndicator(),
              error: (_, __) => const CircularProgressIndicator(), // Still show loading on error
            ),
            const SizedBox(height: BlannerSpacing.lg),
            // App name
            Text(
              'Blanner',
              style: BlannerTextStyles.headline1.copyWith(
                color: BlannerColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: BlannerSpacing.sm),
            // Loading text
            categoriesAsync.when(
              data: (_) => const SizedBox.shrink(),
              loading: () => Text(
                'Loading...',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
              ),
              error: (error, _) => Text(
                'Loading categories...',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

