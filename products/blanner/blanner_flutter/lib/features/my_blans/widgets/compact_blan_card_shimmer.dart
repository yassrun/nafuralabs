import 'package:flutter/material.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';

/// Shimmer placeholder for compact BLAN card
class CompactBlanCardShimmer extends StatelessWidget {
  const CompactBlanCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      margin: const EdgeInsets.only(bottom: BlannerSpacing.sm),
      decoration: BoxDecoration(
        color: BlannerColors.surface,
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        border: Border.all(
          color: BlannerColors.textSecondary.withValues(alpha: 0.1),
          width: 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: BlannerSpacing.md,
          vertical: BlannerSpacing.sm,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top row: Title + Badge
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 16,
                    decoration: BoxDecoration(
                      color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(width: BlannerSpacing.sm),
                Container(
                  width: 60,
                  height: 20,
                  decoration: BoxDecoration(
                    color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(BlannerRadius.small),
                  ),
                ),
              ],
            ),
            // Category
            Container(
              width: 80,
              height: 12,
              decoration: BoxDecoration(
                color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            // Date/Time/Location row
            Row(
              children: [
                Container(
                  width: 60,
                  height: 12,
                  decoration: BoxDecoration(
                    color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: BlannerSpacing.xs),
                Container(
                  width: 50,
                  height: 12,
                  decoration: BoxDecoration(
                    color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(width: BlannerSpacing.xs),
                Expanded(
                  child: Container(
                    height: 12,
                    decoration: BoxDecoration(
                      color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ],
            ),
            // Bottom row: Participants + Button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 50,
                  height: 12,
                  decoration: BoxDecoration(
                    color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                Container(
                  width: 70,
                  height: 20,
                  decoration: BoxDecoration(
                    color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}








