import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/enums.dart';
import '../providers/create_blan_provider.dart';

class StepPoliciesVisibility extends ConsumerWidget {
  const StepPoliciesVisibility({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;

    return ListView(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        Text(
          'Policies & Visibility',
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Bill Policy
        Text(
          'Bill Policy *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        ...BillPolicy.values.map((policy) {
          final isSelected = data.billPolicy == policy;
          return Padding(
            padding: const EdgeInsets.only(bottom: BlannerSpacing.sm),
            child: InkWell(
              onTap: () {
                ref.read(createBlanProvider.notifier).updateData(
                      data.copyWith(billPolicy: policy),
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
                    Text(
                      policy.toEmoji(),
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(width: BlannerSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            policy.toLabel(),
                            style: BlannerTextStyles.body1.copyWith(
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? BlannerColors.primary
                                  : BlannerColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: BlannerSpacing.xs),
                          Text(
                            _getBillPolicyDescription(policy),
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
        // Visibility
        Text(
          'Visibility *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        ...VisibilityEnum.values.map((visibility) {
          final isSelected = data.visibility == visibility;
          return Padding(
            padding: const EdgeInsets.only(bottom: BlannerSpacing.sm),
            child: InkWell(
              onTap: () {
                ref.read(createBlanProvider.notifier).updateData(
                      data.copyWith(visibility: visibility),
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
                    Text(
                      visibility.toEmoji(),
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(width: BlannerSpacing.md),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            visibility.toLabel(),
                            style: BlannerTextStyles.body1.copyWith(
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? BlannerColors.primary
                                  : BlannerColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: BlannerSpacing.xs),
                          Text(
                            visibility.toDescription(),
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
      ],
    );
  }

  String _getBillPolicyDescription(BillPolicy policy) {
    switch (policy) {
      case BillPolicy.invite:
        return 'I will cover the expenses';
      case BillPolicy.beInvited:
        return 'I want to be invited';
      case BillPolicy.split:
        return 'Split the bill equally';
      case BillPolicy.decideLater:
        return 'We\'ll decide later';
    }
  }
}

