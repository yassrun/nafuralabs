import 'package:flutter/material.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_button.dart';
import '../../../../design_system/widgets/bl_cached_image.dart';
import '../data/blan_model.dart';

class BlHeroCard extends StatelessWidget {
  const BlHeroCard({
    super.key,
    required this.blan,
    required this.onJoinTap,
  });

  final Blan blan;
  final VoidCallback onJoinTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: BlannerSpacing.lg),
      height: 280,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(BlannerRadius.large),
        boxShadow: [
          BoxShadow(
            color: BlannerColors.textSecondary.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(BlannerRadius.large),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Image
            BlCachedImage(
              imageUrl: blan.displayImageUrl,
              fit: BoxFit.cover,
              errorWidget: Container(
                color: BlannerColors.surface,
                child: const Icon(Icons.image, size: 50),
              ),
            ),
            // Gradient overlay
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.7),
                  ],
                ),
              ),
            ),
            // Content
            Positioned(
              left: BlannerSpacing.lg,
              right: BlannerSpacing.lg,
              bottom: BlannerSpacing.lg,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Category tag
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: BlannerSpacing.sm,
                      vertical: BlannerSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: BlannerColors.primary,
                      borderRadius: BorderRadius.circular(BlannerRadius.small),
                    ),
                    child: Text(
                      blan.category,
                      style: BlannerTextStyles.caption.copyWith(
                        color: BlannerColors.surface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(height: BlannerSpacing.md),
                  // Title
                  Text(
                    blan.title,
                    style: BlannerTextStyles.headline2.copyWith(
                      color: BlannerColors.surface,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: BlannerSpacing.xs),
                  // Subtitle
                  Text(
                    '${blan.formattedDate} · ${blan.formattedTime} · ${blan.locationName}',
                    style: BlannerTextStyles.body2.copyWith(
                      color: BlannerColors.surface.withValues(alpha: 0.9),
                    ),
                  ),
                  const SizedBox(height: BlannerSpacing.md),
                  // CTA Button
                  SizedBox(
                    width: double.infinity,
                    child: BlannerPrimaryButton(
                      label: blan.status.displayText,
                      onPressed: blan.status.isDisabled ? null : onJoinTap,
                      fullWidth: true,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

