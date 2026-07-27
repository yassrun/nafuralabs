import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../user/application/current_user_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: BlannerColors.background,
      appBar: AppBar(
        title: Text(
          'Profile',
          style: BlannerTextStyles.headline2,
        ),
        backgroundColor: BlannerColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: user != null
          ? SingleChildScrollView(
              padding: const EdgeInsets.all(BlannerSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile Header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundColor: BlannerColors.primary.withValues(alpha: 0.1),
                        backgroundImage: user.avatarUrl != null
                            ? NetworkImage(user.avatarUrl!)
                            : null,
                        child: user.avatarUrl == null
                            ? Text(
                                user.name.isNotEmpty
                                    ? user.name[0].toUpperCase()
                                    : 'U',
                                style: BlannerTextStyles.headline1.copyWith(
                                  color: BlannerColors.primary,
                                ),
                              )
                            : null,
                      ),
                      const SizedBox(width: BlannerSpacing.lg),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: BlannerTextStyles.headline2,
                            ),
                            const SizedBox(height: BlannerSpacing.xs),
                            Text(
                              '@${user.username}',
                              style: BlannerTextStyles.body2.copyWith(
                                color: BlannerColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: BlannerSpacing.xl),
                  // Profile Info Section
                  Text(
                    'About',
                    style: BlannerTextStyles.subtitle1.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: BlannerSpacing.md),
                  if (user.bio != null && user.bio!.isNotEmpty)
                    Text(
                      user.bio!,
                      style: BlannerTextStyles.body1,
                    )
                  else
                    Text(
                      'No bio yet',
                      style: BlannerTextStyles.body2.copyWith(
                        color: BlannerColors.textSecondary,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  const SizedBox(height: BlannerSpacing.xl),
                  // Additional Info
                  _buildInfoRow('Email', user.email ?? 'Not provided'),
                  if (user.phone != null)
                    _buildInfoRow('Phone', user.phone!),
                  _buildInfoRow(
                    'Gender',
                    user.gender?.toString().split('.').last ?? 'Not specified',
                  ),
                ],
              ),
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 64,
                    color: BlannerColors.textSecondary,
                  ),
                  const SizedBox(height: BlannerSpacing.lg),
                  Text(
                    'No user profile',
                    style: BlannerTextStyles.headline2,
                  ),
                  const SizedBox(height: BlannerSpacing.sm),
                  Text(
                    'Please log in to view your profile',
                    style: BlannerTextStyles.body2.copyWith(
                      color: BlannerColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: BlannerSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: BlannerTextStyles.body1,
            ),
          ),
        ],
      ),
    );
  }
}

