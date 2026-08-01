import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_text_field.dart';
import '../models/enums.dart';
import '../providers/categories_provider.dart';
import '../providers/create_blan_provider.dart';

class StepBasicInfo extends ConsumerStatefulWidget {
  const StepBasicInfo({super.key});

  @override
  ConsumerState<StepBasicInfo> createState() => _StepBasicInfoState();
}

class _StepBasicInfoState extends ConsumerState<StepBasicInfo> {
  final _planInfoController = TextEditingController();

  @override
  void dispose() {
    _planInfoController.dispose();
    super.dispose();
  }

  void _updateData() {
    final currentData = ref.read(createBlanProvider).data;
    final text = _planInfoController.text.trim();
    ref.read(createBlanProvider.notifier).updateData(
          currentData.copyWith(
            customDescription: text.isEmpty ? null : text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;
    final l10n = AppLocalizations.of(context)!;
    final categoriesAsync = ref.watch(categoriesProvider);

    return ListView(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        Text(
          l10n.basicInformation,
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Category
        Text(
          '${l10n.category} *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        categoriesAsync.when(
          data: (categories) {
            if (categories.isEmpty) {
              return Text(
                'No categories available',
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.textSecondary,
                ),
              );
            }
            return Wrap(
              spacing: BlannerSpacing.sm,
              runSpacing: BlannerSpacing.sm,
              children: categories.map((category) {
                final isSelected = data.category?.id == category.id;
                return FilterChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(category.toEmoji()),
                      const SizedBox(width: BlannerSpacing.xs),
                      Text(category.toLabel()),
                    ],
                  ),
                  selected: isSelected,
                  onSelected: (selected) {
                    ref.read(createBlanProvider.notifier).updateData(
                          data.copyWith(
                            category: selected ? category : null,
                            coverImageUrl: selected
                                ? category.getDefaultImageUrl()
                                : null,
                          ),
                        );
                  },
                  selectedColor: BlannerColors.primary,
                  checkmarkColor: BlannerColors.surface,
                  backgroundColor: BlannerColors.surface,
                  side: BorderSide(
                    color: isSelected
                        ? BlannerColors.primary
                        : BlannerColors.textSecondary.withValues(alpha: 0.2),
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(BlannerRadius.medium),
                  ),
                );
              }).toList(),
            );
          },
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(BlannerSpacing.lg),
              child: CircularProgressIndicator(),
            ),
          ),
          error: (error, stackTrace) => Container(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            decoration: BoxDecoration(
              color: BlannerColors.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Failed to load categories',
                  style: BlannerTextStyles.body1.copyWith(
                    color: BlannerColors.error,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: BlannerSpacing.xs),
                Text(
                  error.toString(),
                  style: BlannerTextStyles.caption.copyWith(
                    color: BlannerColors.textSecondary,
                  ),
                ),
                const SizedBox(height: BlannerSpacing.sm),
                TextButton(
                  onPressed: () {
                    ref.invalidate(categoriesProvider);
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Mood
        Text(
          '${l10n.mood} *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        Wrap(
          spacing: BlannerSpacing.sm,
          runSpacing: BlannerSpacing.sm,
          children: Mood.values.map((mood) {
            final isSelected = data.mood == mood;
            return FilterChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(mood.toEmoji()),
                  const SizedBox(width: BlannerSpacing.xs),
                  Text(mood.toLabel()),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                ref.read(createBlanProvider.notifier).updateData(
                      data.copyWith(mood: selected ? mood : null),
                    );
              },
              selectedColor: BlannerColors.primary,
              checkmarkColor: BlannerColors.surface,
              backgroundColor: BlannerColors.surface,
              side: BorderSide(
                color: isSelected
                    ? BlannerColors.primary
                    : BlannerColors.textSecondary.withValues(alpha: 0.2),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(BlannerRadius.medium),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Description
        BlTextField(
          controller: _planInfoController,
          label: l10n.descriptionOptional,
          hintText: l10n.descriptionHint,
          maxLines: 5,
          maxLength: 500,
          onChanged: (_) => _updateData(),
        ),
      ],
    );
  }
}

