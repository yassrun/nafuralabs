import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/my_blan.dart';
import '../providers/my_blans_provider.dart';
import '../widgets/compact_blan_card.dart';
import '../widgets/my_blan_card.dart';
import '../widgets/my_blans_tabs.dart';

class MyBlansPage extends ConsumerWidget {
  const MyBlansPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myBlansProvider);
    final notifier = ref.read(myBlansProvider.notifier);

    return Scaffold(
      backgroundColor: BlannerColors.background,
      appBar: AppBar(
        title: Text(
          'My BLANs',
          style: BlannerTextStyles.headline2,
        ),
        backgroundColor: BlannerColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Tabs
          MyBlansTabs(
            selectedTab: state.selectedTab,
            onTabSelected: (tab) => notifier.selectTab(tab),
            createdCount: state.createdBlans.length,
            participatingCount: state.participatingBlans.length,
            requestsCount: state.pendingRequests.length,
          ),
          // Content
          Expanded(
            child: _buildContent(context, ref, state),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    state,
  ) {
    if (state.isLoading && _getCurrentList(state).isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state.error != null && _getCurrentList(state).isEmpty) {
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
              onPressed: () => ref.read(myBlansProvider.notifier).loadAll(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final blans = _getCurrentList(state);

    if (blans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _getEmptyIcon(state.selectedTab),
              size: 64,
              color: BlannerColors.textSecondary,
            ),
            const SizedBox(height: BlannerSpacing.lg),
            Text(
              _getEmptyTitle(state.selectedTab),
              style: BlannerTextStyles.headline2,
            ),
            const SizedBox(height: BlannerSpacing.sm),
            Text(
              _getEmptyMessage(state.selectedTab),
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(myBlansProvider.notifier).loadAll(),
      child: ListView.builder(
        padding: const EdgeInsets.all(BlannerSpacing.lg),
        itemCount: blans.length,
        itemBuilder: (context, index) {
          final blan = blans[index];
          // Use compact card for created BLANs, regular card for others
          if (state.selectedTab == MyBlansTab.created) {
            return CompactBlanCard(
              blan: blan,
              onManageTap: () {
                // TODO: Navigate to BLAN details view for organizer controls
                // For now, show a placeholder
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Manage BLAN: ${blan.title}'),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            );
          }
          return Padding(
            padding: const EdgeInsets.only(bottom: BlannerSpacing.md),
            child: MyBlanCard(blan: blan),
          );
        },
      ),
    );
  }

  List<MyBlan> _getCurrentList(state) {
    switch (state.selectedTab) {
      case MyBlansTab.created:
        return state.createdBlans;
      case MyBlansTab.participating:
        return state.participatingBlans;
      case MyBlansTab.requests:
        return state.pendingRequests;
      default:
        return [];
    }
  }

  IconData _getEmptyIcon(MyBlansTab tab) {
    switch (tab) {
      case MyBlansTab.created:
        return Icons.event_note;
      case MyBlansTab.participating:
        return Icons.group;
      case MyBlansTab.requests:
        return Icons.pending_actions;
    }
  }

  String _getEmptyTitle(MyBlansTab tab) {
    switch (tab) {
      case MyBlansTab.created:
        return 'You haven\'t created any BLANs yet.';
      case MyBlansTab.participating:
        return 'Not participating in any BLANs';
      case MyBlansTab.requests:
        return 'No pending requests';
    }
  }

  String _getEmptyMessage(MyBlansTab tab) {
    switch (tab) {
      case MyBlansTab.created:
        return 'Create your first BLAN and start inviting people.';
      case MyBlansTab.participating:
        return 'Join BLANs from the home feed to see them here';
      case MyBlansTab.requests:
        return 'You don\'t have any pending join requests';
    }
  }
}

