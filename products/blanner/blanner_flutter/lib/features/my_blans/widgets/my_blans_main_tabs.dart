import 'package:flutter/material.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../providers/my_blans_v2_provider.dart';

class MyBlansMainTabs extends StatelessWidget {
  const MyBlansMainTabs({
    super.key,
    required this.selectedTab,
    required this.onTabSelected,
    required this.createdCount,
    required this.activityCount,
  });

  final MyBlansMainTab selectedTab;
  final void Function(MyBlansMainTab) onTabSelected;
  final int createdCount;
  final int activityCount;

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
            child: _buildTab(
              context,
              'Created',
              MyBlansMainTab.created,
              createdCount,
            ),
          ),
          Expanded(
            child: _buildTab(
              context,
              'My Activity',
              MyBlansMainTab.myActivity,
              activityCount,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(
    BuildContext context,
    String label,
    MyBlansMainTab tab,
    int count,
  ) {
    final isSelected = selectedTab == tab;

    return InkWell(
      onTap: () => onTabSelected(tab),
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








