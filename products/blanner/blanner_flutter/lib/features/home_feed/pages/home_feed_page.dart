import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../create_blan/pages/create_blan_page.dart';
import '../providers/home_feed_provider.dart';
import '../widgets/bl_blan_card.dart';
import '../widgets/bl_filter_chips.dart';
import '../widgets/bl_hero_card.dart';
import '../widgets/bl_top_bar.dart';

class HomeFeedPage extends ConsumerStatefulWidget {
  const HomeFeedPage({super.key});

  @override
  ConsumerState<HomeFeedPage> createState() => _HomeFeedPageState();
}

class _HomeFeedPageState extends ConsumerState<HomeFeedPage> {
  @override
  void initState() {
    super.initState();
    // Load blans when page initializes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(homeFeedProvider.notifier).loadBlans();
    });
  }

  void _onCreateBlan() async {
    final result = await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const CreateBlanPage(),
      ),
    );
    
    // If blan was created successfully, refresh the feed
    if (result == true && mounted) {
      ref.read(homeFeedProvider.notifier).loadBlans(
        filter: ref.read(homeFeedProvider).selectedFilter,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(homeFeedProvider);

    return Scaffold(
      backgroundColor: BlannerColors.background,
      appBar: BlTopBar(
        title: 'Explore BLANs',
        onSearchTap: () {
          // TODO: Navigate to search
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await ref.read(homeFeedProvider.notifier).loadBlans(
                filter: feedState.selectedFilter,
              );
        },
        child: _buildBody(feedState),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: FloatingActionButton(
        onPressed: _onCreateBlan,
        backgroundColor: Theme.of(context).colorScheme.primary,
        elevation: 6,
        child: const Icon(
          Icons.local_activity,
          color: Colors.white,
          size: 26,
        ),
      ),
    );
  }

  Widget _buildBody(HomeFeedState state) {
    if (state.isLoading && state.blans.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    if (state.error != null && state.blans.isEmpty) {
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
              onPressed: () {
                ref.read(homeFeedProvider.notifier).loadBlans();
              },
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.blans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.event_busy,
              size: 64,
              color: BlannerColors.textSecondary,
            ),
            const SizedBox(height: BlannerSpacing.lg),
            Text(
              'No BLANs found',
              style: BlannerTextStyles.headline2,
            ),
            const SizedBox(height: BlannerSpacing.sm),
            Text(
              'Try selecting a different filter',
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        // Filter Chips
        BlFilterChips(
          selected: state.selectedFilter,
          onSelect: (filter) {
            ref.read(homeFeedProvider.notifier).loadBlans(filter: filter);
          },
        ),
        const SizedBox(height: BlannerSpacing.md),
        // Content
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 100),
            itemCount: state.blans.length,
            itemBuilder: (context, index) {
              final blan = state.blans[index];
              // Hero card for first item
              if (index == 0) {
                return Column(
                  children: [
                    BlHeroCard(
                      blan: blan,
                      onJoinTap: () async {
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
                    ),
                    const SizedBox(height: BlannerSpacing.md),
                    BlBlanCard(blan: blan),
                  ],
                );
              }
              // Regular cards for rest
              return BlBlanCard(blan: blan);
            },
          ),
        ),
      ],
    );
  }
}

