import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_button.dart';
import '../../../../design_system/widgets/bl_cached_image.dart';
import '../data/blan_model.dart';
import '../providers/home_feed_provider.dart';

class BlBlanCard extends ConsumerWidget {
  const BlBlanCard({
    super.key,
    required this.blan,
  });

  final Blan blan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: BlannerSpacing.lg,
        vertical: BlannerSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: BlannerColors.surface,
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        boxShadow: [
          BoxShadow(
            color: BlannerColors.textSecondary.withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // A. Image Banner
          _ImageBanner(blan: blan),
          // B. Info Section
          Padding(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  blan.title,
                  style: BlannerTextStyles.headline2.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: BlannerSpacing.xs),
                // Metadata
                Text(
                  '${blan.formattedDate} · ${blan.formattedTime} · ${blan.locationName}',
                  style: BlannerTextStyles.body2.copyWith(
                    color: BlannerColors.textSecondary,
                  ),
                ),
                const SizedBox(height: BlannerSpacing.xs),
                // Participants
                Text(
                  '${blan.currentParticipants}/${blan.maxParticipants} participants',
                  style: BlannerTextStyles.caption.copyWith(
                    color: BlannerColors.textSecondary,
                  ),
                ),
                const SizedBox(height: BlannerSpacing.md),
                // C. Organizer Row
                Row(
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: BlannerColors.primary,
                      child: Text(
                        blan.organizerName[0].toUpperCase(),
                        style: BlannerTextStyles.caption.copyWith(
                          color: BlannerColors.surface,
                        ),
                      ),
                    ),
                    const SizedBox(width: BlannerSpacing.sm),
                    Text(
                      'by ${blan.organizerName}',
                      style: BlannerTextStyles.body2.copyWith(
                        color: BlannerColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: BlannerSpacing.md),
                // D. Action Row
                Row(
                  children: [
                    // Left icons with counts
                    // Heart icon with count
                    GestureDetector(
                      onTap: () {
                        ref.read(homeFeedProvider.notifier).toggleLike(blan.id);
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            blan.userLiked
                                ? Icons.favorite
                                : Icons.favorite_border,
                            color: blan.userLiked
                                ? BlannerColors.primary
                                : BlannerColors.textSecondary,
                            size: 22,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            blan.likeCount.toString(),
                            style: BlannerTextStyles.body2.copyWith(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: BlannerColors.textPrimary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: BlannerSpacing.md),
                    // Bookmark icon
                    GestureDetector(
                      onTap: () {
                        ref.read(homeFeedProvider.notifier).toggleSave(blan.id);
                      },
                      child: Icon(
                        blan.userSaved
                            ? Icons.bookmark
                            : Icons.bookmark_border,
                        color: blan.userSaved
                            ? BlannerColors.primary
                            : BlannerColors.textSecondary,
                        size: 22,
                      ),
                    ),
                    const Spacer(),
                    // Right side: Primary CTA
                    SizedBox(
                      width: 120,
                      child: BlannerPrimaryButton(
                        label: blan.status.displayText,
                        onPressed: blan.status.isDisabled
                            ? null
                            : () async {
                                await ref
                                    .read(homeFeedProvider.notifier)
                                    .requestJoin(blan.id);
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Request sent'),
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                }
                              },
                        fullWidth: false,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ImageBanner extends StatelessWidget {
  const _ImageBanner({required this.blan});

  final Blan blan;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Image
        ClipRRect(
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(BlannerRadius.medium),
            topRight: Radius.circular(BlannerRadius.medium),
          ),
          child: AspectRatio(
            aspectRatio: 4 / 3,
            child: BlCachedImage(
              imageUrl: blan.displayImageUrl,
              fit: BoxFit.cover,
              errorWidget: Container(
                color: BlannerColors.surface,
                child: const Icon(Icons.image, size: 50),
              ),
            ),
          ),
        ),
        // Category tag (top-left)
        Positioned(
          top: BlannerSpacing.sm,
          left: BlannerSpacing.sm,
          child: Container(
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
        ),
        // Distance tag (top-right)
        Positioned(
          top: BlannerSpacing.sm,
          right: BlannerSpacing.sm,
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: BlannerSpacing.sm,
              vertical: BlannerSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: BlannerColors.background.withValues(alpha: 0.9),
              borderRadius: BorderRadius.circular(BlannerRadius.small),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.location_on,
                  size: 12,
                  color: BlannerColors.textPrimary,
                ),
                const SizedBox(width: 4),
                Text(
                  blan.formattedDistance,
                  style: BlannerTextStyles.caption.copyWith(
                    color: BlannerColors.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

