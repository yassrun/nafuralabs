import 'package:flutter/material.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../home_feed/data/participation_status.dart';
import '../models/blan_for_my_blans.dart';

/// Compact BLAN card for displaying BLANs in My BLANs section
/// Height: 95-120px max, no image, minimal padding
class CompactBlanCardV2 extends StatelessWidget {
  const CompactBlanCardV2({
    super.key,
    required this.blan,
    this.onTap,
    this.showPendingRequestsBadge = false,
    this.buttonLabel = 'Manage',
    this.buttonAction,
  });

  final BlanForMyBlans blan;
  final VoidCallback? onTap;
  final bool showPendingRequestsBadge;
  final String buttonLabel;
  final VoidCallback? buttonAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(
        minHeight: 95,
        maxHeight: 120,
      ),
      margin: const EdgeInsets.only(bottom: BlannerSpacing.sm),
      decoration: BoxDecoration(
        color: BlannerColors.surface,
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        border: Border.all(
          color: BlannerColors.textSecondary.withValues(alpha: 0.1),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: BlannerColors.textSecondary.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap ?? buttonAction,
          borderRadius: BorderRadius.circular(BlannerRadius.medium),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: BlannerSpacing.md,
              vertical: BlannerSpacing.sm,
            ),
            child: SizedBox(
              height: 110, // Target height within 95-120px range
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top row: Title + Status badge + Pending requests badge
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              blan.title,
                              style: BlannerTextStyles.subtitle1.copyWith(
                                fontWeight: FontWeight.w600,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (showPendingRequestsBadge && blan.pendingRequestsCount > 0) ...[
                              const SizedBox(height: BlannerSpacing.xs / 2),
                              _PendingRequestsBadge(
                                count: blan.pendingRequestsCount,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: BlannerSpacing.sm),
                      _StatusBadge(status: blan.status),
                    ],
                  ),
                  // Second row: Category
                  Text(
                    blan.category,
                    style: BlannerTextStyles.caption.copyWith(
                      color: BlannerColors.textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  // Third row: Date • Time • Location
                  Row(
                    children: [
                      Icon(
                        Icons.calendar_today,
                        size: 14,
                        color: BlannerColors.textSecondary,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(
                        blan.formattedDate,
                        style: BlannerTextStyles.caption,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(
                        '•',
                        style: BlannerTextStyles.caption.copyWith(
                          color: BlannerColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Icon(
                        Icons.access_time,
                        size: 14,
                        color: BlannerColors.textSecondary,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(
                        blan.formattedTime,
                        style: BlannerTextStyles.caption,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(
                        '•',
                        style: BlannerTextStyles.caption.copyWith(
                          color: BlannerColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Icon(
                        Icons.location_on,
                        size: 14,
                        color: BlannerColors.textSecondary,
                      ),
                      const SizedBox(width: BlannerSpacing.xs),
                      Expanded(
                        child: Text(
                          blan.locationLabel,
                          style: BlannerTextStyles.caption,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  // Fourth row: Participants + Action button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            Icons.group,
                            size: 14,
                            color: BlannerColors.textSecondary,
                          ),
                          const SizedBox(width: BlannerSpacing.xs),
                          Text(
                            '${blan.participantsCount}/${blan.maxParticipants}',
                            style: BlannerTextStyles.caption,
                          ),
                        ],
                      ),
                      TextButton(
                        onPressed: buttonAction ?? onTap,
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: BlannerSpacing.sm,
                            vertical: BlannerSpacing.xs,
                          ),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              buttonLabel,
                              style: BlannerTextStyles.caption.copyWith(
                                color: BlannerColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(width: 2),
                            Icon(
                              Icons.arrow_forward_ios,
                              size: 12,
                              color: BlannerColors.primary,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});

  final BlanStatus status;

  @override
  Widget build(BuildContext context) {
    final (text, color) = _getStatusInfo(status);
    
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: BlannerSpacing.sm,
        vertical: BlannerSpacing.xs / 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(BlannerRadius.small),
      ),
      child: Text(
        text,
        style: BlannerTextStyles.caption.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }

  (String, Color) _getStatusInfo(BlanStatus status) {
    switch (status) {
      case BlanStatus.upcoming:
        return ('UPCOMING', BlannerColors.primary);
      case BlanStatus.past:
        return ('PAST', BlannerColors.textSecondary);
      case BlanStatus.canceled:
        return ('CANCELED', BlannerColors.error);
    }
  }
}

class _PendingRequestsBadge extends StatelessWidget {
  const _PendingRequestsBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: BlannerSpacing.xs,
        vertical: 2,
      ),
      decoration: BoxDecoration(
        color: BlannerColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(BlannerRadius.small),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '🔥',
            style: BlannerTextStyles.caption.copyWith(fontSize: 10),
          ),
          const SizedBox(width: 2),
          Text(
            '$count request${count > 1 ? 's' : ''} waiting',
            style: BlannerTextStyles.caption.copyWith(
              color: BlannerColors.primary,
              fontWeight: FontWeight.w600,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}

/// Badge for My Activity tab
class ActivityStatusBadge extends StatelessWidget {
  const ActivityStatusBadge({
    super.key,
    required this.participationStatus,
  });

  final ParticipationStatus participationStatus;

  @override
  Widget build(BuildContext context) {
    final (text, color) = _getStatusInfo(participationStatus);
    
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: BlannerSpacing.sm,
        vertical: BlannerSpacing.xs / 2,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(BlannerRadius.small),
      ),
      child: Text(
        text,
        style: BlannerTextStyles.caption.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }

  (String, Color) _getStatusInfo(ParticipationStatus status) {
    switch (status) {
      case ParticipationStatus.accepted:
        return ('ACCEPTED', BlannerColors.success);
      case ParticipationStatus.requested:
        return ('PENDING', BlannerColors.warning);
      case ParticipationStatus.rejected:
      case ParticipationStatus.shortlisted:
        return ('NOT SELECTED', BlannerColors.textSecondary);
      default:
        return ('PENDING', BlannerColors.textSecondary);
    }
  }
}








