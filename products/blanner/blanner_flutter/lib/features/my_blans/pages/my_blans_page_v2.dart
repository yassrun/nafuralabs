import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/typography.dart';
import '../providers/my_blans_v2_provider.dart';
import '../widgets/created_tab.dart';
import '../widgets/my_activity_tab.dart';
import '../widgets/my_blans_main_tabs.dart';

class MyBlansPageV2 extends ConsumerWidget {
  const MyBlansPageV2({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(myBlansV2Provider);
    final notifier = ref.read(myBlansV2Provider.notifier);

    // Calculate activity count
    final activityCount = state.myActivityData != null
        ? state.myActivityData!.accepted.length +
            state.myActivityData!.pending.length +
            state.myActivityData!.notSelected.length
        : 0;

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
          // Main tabs: Created | My Activity
          MyBlansMainTabs(
            selectedTab: state.selectedMainTab,
            onTabSelected: (tab) => notifier.selectMainTab(tab),
            createdCount: state.createdBlans.length,
            activityCount: activityCount,
          ),
          // Content
          Expanded(
            child: _buildContent(state.selectedMainTab),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(MyBlansMainTab tab) {
    switch (tab) {
      case MyBlansMainTab.created:
        return const CreatedTab();
      case MyBlansMainTab.myActivity:
        return const MyActivityTab();
    }
  }
}








