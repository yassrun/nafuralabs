import 'package:flutter/material.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../providers/my_blans_provider.dart';

class MyBlansTabs extends StatelessWidget {
  const MyBlansTabs({
    super.key,
    required this.selectedTab,
    required this.onTabSelected,
    required this.createdCount,
    required this.participatingCount,
    required this.requestsCount,
  });

  final MyBlansTab selectedTab;
  final void Function(MyBlansTab) onTabSelected;
  final int createdCount;
  final int participatingCount;
  final int requestsCount;

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
              MyBlansTab.created,
              createdCount,
            ),
          ),
          Expanded(
            child: _buildTab(
              context,
              'Participating',
              MyBlansTab.participating,
              participatingCount,
            ),
          ),
          Expanded(
            child: _buildTab(
              context,
              'Requests',
              MyBlansTab.requests,
              requestsCount,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTab(
    BuildContext context,
    String label,
    MyBlansTab tab,
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

