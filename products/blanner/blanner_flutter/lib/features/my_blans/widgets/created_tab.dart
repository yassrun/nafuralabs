import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../providers/my_blans_v2_provider.dart';
import 'compact_blan_card_shimmer.dart';
import 'compact_blan_card_v2.dart';

class CreatedTab extends ConsumerWidget {
  const CreatedTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myBlansV2Provider);
    final notifier = ref.read(myBlansV2Provider.notifier);

    if (state.isLoading && state.createdBlans.isEmpty) {
      return _buildShimmerList();
    }

    if (state.error != null && state.createdBlans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Error loading BLANs',
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

    if (state.createdBlans.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: () => notifier.loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(BlannerSpacing.lg),
        itemCount: state.createdBlans.length,
        itemBuilder: (context, index) {
          final blan = state.createdBlans[index];
          return CompactBlanCardV2(
            blan: blan,
            showPendingRequestsBadge: blan.pendingRequestsCount > 0,
            buttonLabel: 'Manage',
            onTap: () {
              // Navigate to BLAN details
              Navigator.pushNamed(
                context,
                '/blan-details',
                arguments: blan.id,
              );
            },
            buttonAction: () {
              // Navigate to BLAN details
              Navigator.pushNamed(
                context,
                '/blan-details',
                arguments: blan.id,
              );
            },
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
            Icons.event_note,
            size: 64,
            color: BlannerColors.textSecondary,
          ),
          const SizedBox(height: BlannerSpacing.lg),
          Text(
            'You haven\'t created any BLANs yet.',
            style: BlannerTextStyles.headline2,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: BlannerSpacing.sm),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.xl),
            child: Text(
              'Create your first BLAN and start inviting people.',
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

