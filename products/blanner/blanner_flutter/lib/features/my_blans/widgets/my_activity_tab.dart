import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../home_feed/data/participation_status.dart';
import '../models/activity_filter.dart';
import '../models/blan_for_my_blans.dart';
import '../providers/my_blans_v2_provider.dart';
import 'compact_blan_card_shimmer.dart';

class MyActivityTab extends ConsumerWidget {
  const MyActivityTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myBlansV2Provider);
    final notifier = ref.read(myBlansV2Provider.notifier);

    if (state.isLoading && state.myActivityData == null) {
      return _buildShimmerList();
    }

    if (state.error != null && state.myActivityData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Error loading activity',
              style: BlannerTextStyles.headline2,
            ),
            const SizedBox(height: BlannerSpacing.md),
            Text(
              state.error!,
              style: BlannerTextStyles.body2,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: BlannerSpacing.lg),
            ElevatedButton(
              onPressed: () => notifier.loadAll(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final activityData = state.myActivityData;
    if (activityData == null) {
      return _buildEmptyState();
    }

    return Column(
      children: [
        // Internal filters: Accepted | Pending | Not Selected
        _ActivityFilters(
          selectedFilter: state.selectedActivityFilter,
          onFilterSelected: (filter) => notifier.selectActivityFilter(filter),
          acceptedCount: activityData.accepted.length,
          pendingCount: activityData.pending.length,
          notSelectedCount: activityData.notSelected.length,
        ),
        // Content
        Expanded(
          child: _buildContent(context, ref, state),
        ),
      ],
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, state) {
    final blans = ref.read(myBlansV2Provider.notifier).getCurrentActivityList();

    if (blans.isEmpty) {
      return _buildEmptyStateForFilter(state.selectedActivityFilter);
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(myBlansV2Provider.notifier).loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(BlannerSpacing.lg),
        itemCount: blans.length,
        itemBuilder: (context, index) {
          final blan = blans[index];
          
          // Determine button label and action based on filter
          String buttonLabel;
          VoidCallback? buttonAction;
          
          if (state.selectedActivityFilter == ActivityFilter.accepted) {
            buttonLabel = 'Open Chat';
            buttonAction = () {
              // Navigate to chat
              Navigator.pushNamed(
                context,
                '/blan-chat',
                arguments: blan.id,
              );
            };
          } else {
            buttonLabel = 'Details';
            buttonAction = () {
              // Navigate to BLAN details
              Navigator.pushNamed(
                context,
                '/blan-details',
                arguments: blan.id,
              );
            };
          }

          // For My Activity, we need to show participation status badge instead of BLAN status
          return _ActivityBlanCard(
            blan: blan,
            buttonLabel: buttonLabel,
            onTap: () {
              // Navigate to BLAN details
              Navigator.pushNamed(
                context,
                '/blan-details',
                arguments: blan.id,
              );
            },
            buttonAction: buttonAction,
            participationStatus: blan.participationStatus,
          );
        },
      ),
    );
  }

  Widget _buildShimmerList() {
    return ListView.builder(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      itemCount: 5,
      itemBuilder: (context, index) {
        return const CompactBlanCardShimmer();
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.group,
            size: 64,
            color: BlannerColors.textSecondary,
          ),
          const SizedBox(height: BlannerSpacing.lg),
          Text(
            'No activity yet',
            style: BlannerTextStyles.headline2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: BlannerSpacing.sm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.xl),
            child: Text(
              'Join BLANs from the home feed to see your activity here.',
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyStateForFilter(ActivityFilter filter) {
    String title;
    String message;
    IconData icon;

    switch (filter) {
      case ActivityFilter.accepted:
        title = 'No accepted BLANs';
        message = 'You haven\'t been accepted to any BLANs yet.';
        icon = Icons.check_circle_outline;
        break;
      case ActivityFilter.pending:
        title = 'No pending requests';
        message = 'You don\'t have any pending join requests.';
        icon = Icons.pending_outlined;
        break;
      case ActivityFilter.notSelected:
        title = 'No not selected BLANs';
        message = 'You haven\'t been rejected from any BLANs.';
        icon = Icons.cancel_outlined;
        break;
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: BlannerColors.textSecondary,
          ),
          const SizedBox(height: BlannerSpacing.lg),
          Text(
            title,
            style: BlannerTextStyles.headline2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: BlannerSpacing.sm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.xl),
            child: Text(
              message,
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityFilters extends StatelessWidget {
  const _ActivityFilters({
    required this.selectedFilter,
    required this.onFilterSelected,
    required this.acceptedCount,
    required this.pendingCount,
    required this.notSelectedCount,
  });

  final ActivityFilter selectedFilter;
  final void Function(ActivityFilter) onFilterSelected;
  final int acceptedCount;
  final int pendingCount;
  final int notSelectedCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: BlannerColors.background,
        border: Border(
          bottom: BorderSide(
            color: BlannerColors.textSecondary.withValues(alpha: 0.1),
          ),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildFilterChip(
              'Accepted',
              ActivityFilter.accepted,
              acceptedCount,
            ),
          ),
          Expanded(
            child: _buildFilterChip(
              'Pending',
              ActivityFilter.pending,
              pendingCount,
            ),
          ),
          Expanded(
            child: _buildFilterChip(
              'Not Selected',
              ActivityFilter.notSelected,
              notSelectedCount,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    ActivityFilter filter,
    int count,
  ) {
    final isSelected = selectedFilter == filter;

    return InkWell(
      onTap: () => onFilterSelected(filter),
      child: Container(
        padding: const EdgeInsets.symmetric(
          vertical: BlannerSpacing.md,
          horizontal: BlannerSpacing.sm,
        ),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected
                  ? BlannerColors.primary
                  : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: BlannerTextStyles.body2.copyWith(
                color: isSelected
                    ? BlannerColors.primary
                    : BlannerColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            if (count > 0) ...[
              const SizedBox(height: BlannerSpacing.xs),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: BlannerSpacing.sm,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: isSelected
                      ? BlannerColors.primary
                      : BlannerColors.textSecondary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  count.toString(),
                  style: BlannerTextStyles.caption.copyWith(
                    color: BlannerColors.background,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Custom card for My Activity tab that shows participation status badge
class _ActivityBlanCard extends StatelessWidget {
  const _ActivityBlanCard({
    required this.blan,
    required this.buttonLabel,
    this.onTap,
    this.buttonAction,
    this.participationStatus,
  });

  final BlanForMyBlans blan;
  final String buttonLabel;
  final VoidCallback? onTap;
  final VoidCallback? buttonAction;
  final ParticipationStatus? participationStatus;

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
              height: 110,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top row: Title + Activity Status badge
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          blan.title,
                          style: BlannerTextStyles.subtitle1.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: BlannerSpacing.sm),
                      _ActivityStatusBadge(participationStatus: participationStatus),
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

class _ActivityStatusBadge extends StatelessWidget {
  const _ActivityStatusBadge({this.participationStatus});

  final ParticipationStatus? participationStatus;

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

  (String, Color) _getStatusInfo(ParticipationStatus? status) {
    if (status == null) {
      return ('PENDING', BlannerColors.textSecondary);
    }
    
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

