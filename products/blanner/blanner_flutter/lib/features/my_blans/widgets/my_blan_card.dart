import 'package:flutter/material.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_cached_image.dart';
import '../../home_feed/data/participation_status.dart';
import '../models/my_blan.dart';

class MyBlanCard extends StatelessWidget {
  const MyBlanCard({super.key, required this.blan});

  final MyBlan blan;

  @override
  Widget build(BuildContext context) {
    return Container(
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
          // Image
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(BlannerRadius.medium),
              topRight: Radius.circular(BlannerRadius.medium),
            ),
            child: BlCachedImage(
              imageUrl: blan.displayImageUrl,
              height: 180,
              width: double.infinity,
              fit: BoxFit.cover,
              errorWidget: Container(
                height: 180,
                color: BlannerColors.textSecondary.withValues(alpha: 0.1),
                child: const Icon(Icons.image, size: 48),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Category
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        blan.title,
                        style: BlannerTextStyles.headline2,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (blan.pendingRequests > 0)
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
                          '${blan.pendingRequests}',
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.background,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: BlannerSpacing.xs),
                Text(
                  blan.category,
                  style: BlannerTextStyles.caption.copyWith(
                    color: BlannerColors.textSecondary,
                  ),
                ),
                const SizedBox(height: BlannerSpacing.md),
                // Date and Time
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: BlannerColors.textSecondary,
                    ),
                    const SizedBox(width: BlannerSpacing.xs),
                    Text(
                      blan.formattedDate,
                      style: BlannerTextStyles.body2,
                    ),
                    const SizedBox(width: BlannerSpacing.md),
                    Icon(
                      Icons.access_time,
                      size: 16,
                      color: BlannerColors.textSecondary,
                    ),
                    const SizedBox(width: BlannerSpacing.xs),
                    Text(
                      blan.formattedTime,
                      style: BlannerTextStyles.body2,
                    ),
                  ],
                ),
                const SizedBox(height: BlannerSpacing.xs),
                // Location
                Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      size: 16,
                      color: BlannerColors.textSecondary,
                    ),
                    const SizedBox(width: BlannerSpacing.xs),
                    Expanded(
                      child: Text(
                        blan.locationName,
                        style: BlannerTextStyles.body2.copyWith(
                          color: BlannerColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: BlannerSpacing.md),
                // Participants and Status
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.group,
                          size: 16,
                          color: BlannerColors.textSecondary,
                        ),
                        const SizedBox(width: BlannerSpacing.xs),
                        Text(
                          '${blan.currentParticipants}/${blan.maxParticipants}',
                          style: BlannerTextStyles.body2,
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: BlannerSpacing.sm,
                        vertical: BlannerSpacing.xs,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(blan.status).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(BlannerRadius.small),
                      ),
                      child: Text(
                        blan.status.displayText,
                        style: BlannerTextStyles.caption.copyWith(
                          color: _getStatusColor(blan.status),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                if (blan.isOrganizer && blan.pendingRequests > 0) ...[
                  const SizedBox(height: BlannerSpacing.md),
                  Container(
                    padding: const EdgeInsets.all(BlannerSpacing.sm),
                    decoration: BoxDecoration(
                      color: BlannerColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(BlannerRadius.small),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.notifications_active,
                          size: 16,
                          color: BlannerColors.primary,
                        ),
                        const SizedBox(width: BlannerSpacing.xs),
                        Expanded(
                          child: Text(
                            '${blan.pendingRequests} pending request${blan.pendingRequests > 1 ? 's' : ''}',
                            style: BlannerTextStyles.body2.copyWith(
                              color: BlannerColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(ParticipationStatus status) {
    switch (status) {
      case ParticipationStatus.notRequested:
        return BlannerColors.textSecondary;
      case ParticipationStatus.requested:
        return Colors.orange;
      case ParticipationStatus.shortlisted:
        return Colors.blue;
      case ParticipationStatus.accepted:
        return BlannerColors.primary;
      case ParticipationStatus.rejected:
        return Colors.red;
      case ParticipationStatus.canceled:
        return Colors.grey;
      case ParticipationStatus.left:
        return BlannerColors.textSecondary;
    }
  }
}

