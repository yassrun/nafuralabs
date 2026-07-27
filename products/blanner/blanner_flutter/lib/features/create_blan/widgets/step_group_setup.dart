import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_text_field.dart';
import '../models/enums.dart';
import '../providers/create_blan_provider.dart';

class StepGroupSetup extends ConsumerStatefulWidget {
  const StepGroupSetup({super.key});

  @override
  ConsumerState<StepGroupSetup> createState() => _StepGroupSetupState();
}

class _StepGroupSetupState extends ConsumerState<StepGroupSetup> {
  final _maxParticipantsController = TextEditingController();

  @override
  void dispose() {
    _maxParticipantsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;

    return ListView(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        Text(
          'Group Setup',
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Group Size
        Text(
          'Group Size',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        ...GroupSize.values.map((size) {
          final isSelected = data.groupSize == size;
          return Padding(
            padding: const EdgeInsets.only(bottom: BlannerSpacing.sm),
            child: InkWell(
              onTap: () {
                ref.read(createBlanProvider.notifier).updateData(
                      data.copyWith(groupSize: size),
                    );
              },
              child: Container(
                padding: const EdgeInsets.all(BlannerSpacing.md),
                decoration: BoxDecoration(
                  color: isSelected
                      ? BlannerColors.primary.withValues(alpha: 0.1)
                      : BlannerColors.surface,
                  borderRadius: BorderRadius.circular(BlannerRadius.medium),
                  border: Border.all(
                    color: isSelected
                        ? BlannerColors.primary
                        : BlannerColors.textSecondary.withValues(alpha: 0.2),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            size.toLabel(),
                            style: BlannerTextStyles.body1.copyWith(
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? BlannerColors.primary
                                  : BlannerColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: BlannerSpacing.xs),
                          Text(
                            size.toDescription(),
                            style: BlannerTextStyles.caption.copyWith(
                              color: BlannerColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Icon(
                        Icons.check_circle,
                        color: BlannerColors.primary,
                      ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: BlannerSpacing.lg),
        // Max Participants
        BlTextField(
          controller: _maxParticipantsController,
          label: 'Max Participants (optional)',
          hintText: 'Leave empty for no limit',
          keyboardType: TextInputType.number,
          onSubmitted: (_) {
            final max = int.tryParse(_maxParticipantsController.text);
            ref.read(createBlanProvider.notifier).updateData(
                  data.copyWith(maxParticipants: max),
                );
          },
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Gender Preference
        Text(
          'Gender Preference',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        Wrap(
          spacing: BlannerSpacing.sm,
          runSpacing: BlannerSpacing.sm,
          children: GenderPreference.values.map((pref) {
            final isSelected = data.genderPref == pref;
            return FilterChip(
              label: Text(pref.toLabel()),
              selected: isSelected,
              onSelected: (selected) {
                ref.read(createBlanProvider.notifier).updateData(
                      data.copyWith(genderPref: selected ? pref : null),
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
        // Approval Required
        Container(
          padding: const EdgeInsets.all(BlannerSpacing.md),
          decoration: BoxDecoration(
            color: BlannerColors.surface,
            borderRadius: BorderRadius.circular(BlannerRadius.medium),
            border: Border.all(
              color: BlannerColors.textSecondary.withValues(alpha: 0.2),
            ),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Approval Required',
                      style: BlannerTextStyles.body1.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: BlannerSpacing.xs),
                    Text(
                      'Require approval before joining',
                      style: BlannerTextStyles.caption.copyWith(
                        color: BlannerColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: data.approvalRequired,
                onChanged: (value) {
                  ref.read(createBlanProvider.notifier).updateData(
                        data.copyWith(approvalRequired: value),
                      );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

