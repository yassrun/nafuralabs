import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/routing/app_router.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_logo.dart';
import '../../application/current_user_provider.dart';
import '../../domain/entities/user.dart';

class LoginPage extends ConsumerWidget {
  const LoginPage({super.key});

  void _handleLogin(BuildContext context, WidgetRef ref, int userIndex) {
    if (userIndex == 0) {
      ref.read(mockUserNotifierProvider.notifier).switchToUser1();
    } else {
      ref.read(mockUserNotifierProvider.notifier).switchToUser2();
    }

    // The router's redirect will automatically navigate to home when user is set
    // No need for manual navigation - the redirect in app_router.dart handles this
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen for user changes and navigate when user is set
    ref.listen<User?>(currentUserProvider, (previous, next) {
      if (next != null && context.mounted) {
        // User was just set, navigate to home feed
        context.go(AppRoute.homeFeed.path);
      }
    });

    return Scaffold(
      backgroundColor: BlannerColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(BlannerSpacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: BlannerSpacing.xl * 2),
              const BlannerLogo(),
              const SizedBox(height: BlannerSpacing.xl * 2),
              Text(
                'Welcome to Blanner',
                style: BlannerTextStyles.headline1,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: BlannerSpacing.sm),
              Text(
                'Select a user to continue',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: BlannerSpacing.xl * 2),
              // User 1 button
              _UserLoginButton(
                name: 'Alex Johnson',
                city: 'San Francisco',
                onTap: () => _handleLogin(context, ref, 0),
              ),
              const SizedBox(height: BlannerSpacing.md),
              // User 2 button
              _UserLoginButton(
                name: 'Sarah Martinez',
                city: 'New York',
                onTap: () => _handleLogin(context, ref, 1),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UserLoginButton extends StatelessWidget {
  const _UserLoginButton({
    required this.name,
    required this.city,
    required this.onTap,
  });

  final String name;
  final String city;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(BlannerRadius.medium),
      child: Container(
        padding: const EdgeInsets.all(BlannerSpacing.lg),
        decoration: BoxDecoration(
          color: BlannerColors.surface,
          borderRadius: BorderRadius.circular(BlannerRadius.medium),
          border: Border.all(
            color: BlannerColors.primary.withValues(alpha: 0.3),
            width: 2,
          ),
        ),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 28,
              backgroundColor: BlannerColors.primary,
              child: Text(
                name[0].toUpperCase(),
                style: BlannerTextStyles.headline2.copyWith(
                  color: BlannerColors.surface,
                ),
              ),
            ),
            const SizedBox(width: BlannerSpacing.md),
            // User info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: BlannerTextStyles.headline2,
                  ),
                  const SizedBox(height: BlannerSpacing.xs),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on,
                        size: 16,
                        color: BlannerColors.textSecondary,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(
                        city,
                        style: BlannerTextStyles.body2.copyWith(
                          color: BlannerColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Arrow icon
            Icon(
              Icons.arrow_forward_ios,
              size: 20,
              color: BlannerColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}

