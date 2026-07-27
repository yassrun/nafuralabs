import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_logo.dart';
import '../../../../design_system/widgets/bl_scaffold.dart';
import '../../../user/application/current_user_provider.dart';
import '../../../user/domain/entities/user.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return BlannerScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const BlannerLogo(),
          const SizedBox(height: BlannerSpacing.xl),
          Text(
            'Welcome back!',
            style: BlannerTextStyles.headline1,
          ),
          const SizedBox(height: BlannerSpacing.md),
          if (user != null) ...[
            _UserInfoCard(user: user),
            const SizedBox(height: BlannerSpacing.lg),
            Text(
              'You are connected as a test user for development.',
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
            ),
            const SizedBox(height: BlannerSpacing.sm),
            Text(
              'Authentication will be implemented later.',
              style: BlannerTextStyles.caption.copyWith(
                color: BlannerColors.textSecondary,
              ),
            ),
          ] else ...[
            Text(
              'No user connected',
              style: BlannerTextStyles.body1,
            ),
          ],
        ],
      ),
    );
  }
}

class _UserInfoCard extends StatelessWidget {
  const _UserInfoCard({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      decoration: BoxDecoration(
        color: BlannerColors.surface,
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        border: Border.all(
          color: BlannerColors.textSecondary.withValues(alpha: 0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: BlannerTextStyles.headline2,
                    ),
                    if (user.verifiedFlag) ...[
                      const SizedBox(height: BlannerSpacing.xs),
                      Row(
                        children: [
                          Icon(
                            Icons.verified,
                            size: 16,
                            color: BlannerColors.success,
                          ),
                          const SizedBox(width: BlannerSpacing.xs),
                          Text(
                            'Verified',
                            style: BlannerTextStyles.caption.copyWith(
                              color: BlannerColors.success,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: BlannerSpacing.md),
          _InfoRow(
            icon: Icons.person_outline,
            label: 'Username',
            value: user.username,
          ),
          if (user.email != null) ...[
            const SizedBox(height: BlannerSpacing.sm),
            _InfoRow(
              icon: Icons.email_outlined,
              label: 'Email',
              value: user.email!,
            ),
          ],
          if (user.phone != null) ...[
            const SizedBox(height: BlannerSpacing.sm),
            _InfoRow(
              icon: Icons.phone_outlined,
              label: 'Phone',
              value: user.phone!,
              trailing: user.phoneVerified
                  ? Icon(
                      Icons.check_circle,
                      size: 16,
                      color: BlannerColors.success,
                    )
                  : null,
            ),
          ],
          if (user.city != null) ...[
            const SizedBox(height: BlannerSpacing.sm),
            _InfoRow(
              icon: Icons.location_on_outlined,
              label: 'City',
              value: user.city!,
            ),
          ],
          if (user.bio != null && user.bio!.isNotEmpty) ...[
            const SizedBox(height: BlannerSpacing.md),
            Text(
              'Bio',
              style: BlannerTextStyles.subtitle2,
            ),
            const SizedBox(height: BlannerSpacing.xs),
            Text(
              user.bio!,
              style: BlannerTextStyles.body2,
            ),
          ],
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
    this.trailing,
  });

  final IconData icon;
  final String label;
  final String value;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: BlannerColors.textSecondary),
        const SizedBox(width: BlannerSpacing.sm),
        Text(
          '$label: ',
          style: BlannerTextStyles.body2.copyWith(
            color: BlannerColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: BlannerTextStyles.body2,
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}
