import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_button.dart';
import '../models/enums.dart';
import '../providers/create_blan_provider.dart';
import '../widgets/step_basic_info.dart';
import '../widgets/step_group_setup.dart';
import '../widgets/step_indicator.dart';
import '../widgets/step_location_time.dart';
import '../widgets/step_policies_visibility.dart';

class CreateBlanPage extends ConsumerWidget {
  const CreateBlanPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(createBlanProvider);
    final notifier = ref.read(createBlanProvider.notifier);
    final l10n = AppLocalizations.of(context)!;

    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        
        // Check if user has made any changes
        final hasChanges = _hasChanges(state.data);
        
        if (hasChanges) {
          // Show confirmation dialog
          final shouldPop = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              title: Text(l10n.discardChanges),
              content: Text(l10n.discardChangesMessage),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: Text(l10n.cancel),
                ),
                TextButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: TextButton.styleFrom(
                    foregroundColor: BlannerColors.error,
                  ),
                  child: Text(l10n.discard),
                ),
              ],
            ),
          );
          
          if (shouldPop == true && context.mounted) {
            // Clear state and pop
            notifier.reset();
            Navigator.of(context).pop();
          }
        } else {
          // No changes, just clear state and pop
          notifier.reset();
          Navigator.of(context).pop();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.createBlan),
          backgroundColor: BlannerColors.background,
          elevation: 0,
        ),
      body: Column(
        children: [
          StepIndicator(
            currentStep: state.currentStep,
            totalSteps: 4,
          ),
          const SizedBox(height: BlannerSpacing.sm),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 250),
              child: _buildStep(state.currentStep, ref),
            ),
          ),
          if (state.errorMessage != null)
            Padding(
              padding: const EdgeInsets.all(BlannerSpacing.md),
              child: Text(
                state.errorMessage!,
                style: BlannerTextStyles.body2.copyWith(
                  color: BlannerColors.error,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          _buildBottomBar(context, state, notifier, ref),
        ],
      ),
      ),
    );
  }

  /// Check if user has made any changes from default values
  bool _hasChanges(data) {
    // Check if any non-default values are set
    return data.category != null ||
        data.place != null ||
        data.area != null ||
        data.customDescription != null && data.customDescription!.isNotEmpty ||
        data.maxParticipants != null ||
        data.approvalRequired == true;
  }

  /// Check if NEXT button should be disabled
  bool _isNextDisabled(state) {
    // On step 1 (location/time), require dateTime to be selected
    // Location is optional, so we only validate if a locationMode is selected
    if (state.currentStep == 1) {
      final data = state.data;
      // Require dateTime (day and time must be selected)
      if (data.dateTime == null) {
        return true;
      }
      // Location is optional, but if a locationMode is selected, validate it
      if (data.locationMode != null) {
        // If EXACT is selected, place must be selected
        if (data.locationMode == LocationMode.exact && data.place == null) {
          return true;
        }
        // If AREA is selected, area must be selected
        if (data.locationMode == LocationMode.area && data.area == null) {
          return true;
        }
      }
      // If locationMode is null, that's fine - location is optional
    }
    return false;
  }

  Widget _buildStep(int step, WidgetRef ref) {
    switch (step) {
      case 0:
        return const StepBasicInfo(key: ValueKey(0));
      case 1:
        return const StepLocationTime(key: ValueKey(1));
      case 2:
        return const StepGroupSetup(key: ValueKey(2));
      case 3:
        return const StepPoliciesVisibility(key: ValueKey(3));
      default:
        return const StepBasicInfo(key: ValueKey(0));
    }
  }

  Widget _buildBottomBar(
    BuildContext context,
    state,
    CreateBlanNotifier notifier,
    WidgetRef ref,
  ) {
    final isFirstStep = state.currentStep == 0;
    final isLastStep = state.currentStep == 3;
    final l10n = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      decoration: BoxDecoration(
        color: BlannerColors.background,
        boxShadow: [
          BoxShadow(
            color: BlannerColors.textSecondary.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            if (!isFirstStep)
              Expanded(
                child: BlannerSecondaryButton(
                  label: l10n.back,
                  onPressed: state.isSubmitting
                      ? null
                      : () {
                          notifier.previousStep();
                        },
                  fullWidth: true,
                ),
              ),
            if (!isFirstStep) const SizedBox(width: BlannerSpacing.md),
            Expanded(
              flex: isFirstStep ? 1 : 1,
              child: BlannerPrimaryButton(
                label: isLastStep
                    ? (state.isSubmitting ? l10n.creating : l10n.createBlan)
                    : l10n.next,
                onPressed: state.isSubmitting || _isNextDisabled(state)
                    ? null
                    : () async {
                        // Validate location selection on step 1
                        if (state.currentStep == 1) {
                          final stepWidget = _buildStep(1, ref);
                          if (stepWidget is StepLocationTime) {
                            // Access the validation method through a key or ref
                            // For now, we'll validate directly here
                            final data = state.data;
                            if (data.locationMode == null) {
                              // Show error in state
                              notifier.setErrorMessage(l10n.pleaseChooseLocation);
                              return;
                            }
                            // Additional validation
                            if (data.locationMode == LocationMode.exact && data.place == null) {
                              notifier.setErrorMessage(l10n.pleaseChooseLocation);
                              return;
                            }
                            if (data.locationMode == LocationMode.area && data.area == null) {
                              notifier.setErrorMessage(l10n.pleaseChooseLocation);
                              return;
                            }
                            // Clear any previous error
                            notifier.setErrorMessage(null);
                          }
                        }

                        if (isLastStep) {
                          await notifier.submit();
                          final currentState = ref.read(createBlanProvider);
                          if (context.mounted && currentState.errorMessage == null) {
                            // Clear state before navigating back
                            notifier.reset();
                            // Return true to indicate successful creation
                            Navigator.of(context).pop(true);
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(l10n.blanCreatedSuccessfully),
                                duration: const Duration(seconds: 2),
                              ),
                            );
                          }
                        } else {
                          notifier.nextStep();
                        }
                      },
                isLoading: state.isSubmitting && isLastStep,
                fullWidth: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

