import 'package:flutter/material.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';

class BlFilterChips extends StatelessWidget {
  const BlFilterChips({
    super.key,
    required this.selected,
    required this.onSelect,
  });

  final String? selected;
  final void Function(String) onSelect;

  static const List<String> filters = [
    'Trending',
    'Nearby',
    'For you',
    'Coffee',
    'Sport',
    'Cinema',
    'Games',
    'Food & Drinks',
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: BlannerSpacing.lg),
        itemCount: filters.length,
        separatorBuilder: (context, index) =>
            const SizedBox(width: BlannerSpacing.sm),
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = selected == filter;
          return FilterChip(
            label: Text(filter),
            selected: isSelected,
            onSelected: (selected) {
              if (selected) {
                onSelect(filter);
              }
            },
            selectedColor: BlannerColors.primary,
            checkmarkColor: BlannerColors.surface,
            labelStyle: BlannerTextStyles.body2.copyWith(
              color: isSelected
                  ? BlannerColors.surface
                  : BlannerColors.textPrimary,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
            backgroundColor: BlannerColors.surface,
            side: BorderSide(
              color: isSelected
                  ? BlannerColors.primary
                  : BlannerColors.textSecondary.withValues(alpha: 0.2),
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: BlannerSpacing.md,
              vertical: BlannerSpacing.xs,
            ),
          );
        },
      ),
    );
  }
}

