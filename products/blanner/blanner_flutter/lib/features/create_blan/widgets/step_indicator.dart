import 'package:flutter/material.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';

class StepIndicator extends StatelessWidget {
  const StepIndicator({
    super.key,
    required this.currentStep,
    required this.totalSteps,
  });

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: BlannerSpacing.lg,
        vertical: BlannerSpacing.md,
      ),
      child: Row(
        children: List.generate(totalSteps, (index) {
          final isActive = index == currentStep;
          final isCompleted = index < currentStep;

          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 4,
                    decoration: BoxDecoration(
                      color: isCompleted || isActive
                          ? BlannerColors.primary
                          : BlannerColors.textSecondary.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                if (index < totalSteps - 1)
                  const SizedBox(width: BlannerSpacing.xs),
              ],
            ),
          );
        }),
      ),
    );
  }
}

