import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/blan_repository.dart';
import '../models/blan_creation_request.dart';
import '../models/enums.dart';
import '../utils/title_generator.dart';
import 'categories_provider.dart';

class BlanCreationState {
  final BlanCreationRequest data;
  final int currentStep;
  final bool isSubmitting;
  final String? errorMessage;

  const BlanCreationState({
    required this.data,
    this.currentStep = 0,
    this.isSubmitting = false,
    this.errorMessage,
  });

  BlanCreationState copyWith({
    BlanCreationRequest? data,
    int? currentStep,
    bool? isSubmitting,
    String? errorMessage,
  }) {
    return BlanCreationState(
      data: data ?? this.data,
      currentStep: currentStep ?? this.currentStep,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      errorMessage: errorMessage,
    );
  }
}

class CreateBlanNotifier extends StateNotifier<BlanCreationState> {
  final Ref ref;

  CreateBlanNotifier(this.ref)
      : super(
          BlanCreationState(
            data: BlanCreationRequest(
              // Category will be set from backend categories
              mood: Mood.chill,
              groupSize: GroupSize.plusOne,
              genderPref: GenderPreference.any,
              billPolicy: BillPolicy.decideLater,
              visibility: VisibilityEnum.public,
              // Default to today evening (6 PM)
              dateTime: _getDefaultDateTime(),
            ),
          ),
        ) {
    // Set default category from backend when available
    _setDefaultCategory();
  }

  /// Get default dateTime: today at 6 PM (evening)
  static DateTime _getDefaultDateTime() {
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, 18, 0); // 6 PM
  }

  void _setDefaultCategory() {
    // Try to get categories and set the first one as default
    // This will be called after categories are loaded
    ref.listen(categoriesProvider, (previous, next) {
      next.whenData((categories) {
        if (categories.isNotEmpty && state.data.category == null) {
          // Find "At Home" category or use first one (Coffee)
          final homeCategory = categories.firstWhere(
            (cat) => cat.name.toLowerCase().contains('home') || 
                     cat.name.toLowerCase() == 'at home',
            orElse: () => categories.first,
          );
          print('🏠 Setting default category: ${homeCategory.name} (ID: ${homeCategory.id})');
          state = state.copyWith(
            data: state.data.copyWith(category: homeCategory),
          );
        }
      });
    });
  }

  void updateData(BlanCreationRequest data) {
    print('🔄 CreateBlanNotifier.updateData called');
    print('   Old place: ${state.data.place?.name ?? "null"}');
    print('   New place: ${data.place?.name ?? "null"}');
    print('   Old area: ${state.data.area?.name ?? "null"}');
    print('   New area: ${data.area?.name ?? "null"}');
    // Auto-generate title from BLAN information
    final autoTitle = TitleGenerator.generateTitle(data);
    final updatedData = data.copyWith(title: autoTitle);
    print('   Updating state...');
    state = state.copyWith(data: updatedData);
    print('   ✅ State updated');
    print('   Current place after update: ${state.data.place?.name ?? "null"}');
  }

  void goToStep(int step) {
    if (step >= 0 && step <= 3) {
      state = state.copyWith(currentStep: step);
    }
  }

  void nextStep() {
    if (state.currentStep < 3) {
      state = state.copyWith(currentStep: state.currentStep + 1);
    }
  }

  void previousStep() {
    if (state.currentStep > 0) {
      state = state.copyWith(currentStep: state.currentStep - 1);
    }
  }

  void setErrorMessage(String? message) {
    state = state.copyWith(errorMessage: message);
  }

  Future<void> submit() async {
    // Basic required field validation
    final d = state.data;
    if (d.category == null ||
        d.mood == null ||
        d.dateTime == null ||
        d.groupSize == null ||
        d.genderPref == null ||
        d.billPolicy == null ||
        d.visibility == null) {
      // Note: Error messages should be localized in the UI layer
      state = state.copyWith(
        errorMessage: 'Please fill required fields.', // TODO: Use localization
      );
      return;
    }

    state = state.copyWith(isSubmitting: true, errorMessage: null);

    try {
      final repository = BlanRepository(ref: ref);
      final result = await repository.createBlan(d);

      result.when(
        success: (json) {
          print('✅ BLAN created successfully: $json');
          state = state.copyWith(
            isSubmitting: false,
            errorMessage: null,
          );
        },
        failure: (failure) {
          print('❌ Failed to create BLAN: $failure');
          print('   Error code: ${failure.code}');
          print('   Error message: ${failure.message}');
          
          // If it's a 500 error, it might be due to invalid category ID
          if (failure.code == '500') {
            print('⚠️ 500 error detected - this might be due to invalid category ID');
            print('   Current category: ${d.category?.name ?? "null"}');
            print('   Current category ID: ${d.category?.id ?? "null"}');
            print('   Consider refreshing categories cache');
          }
          
          state = state.copyWith(
            isSubmitting: false,
            errorMessage: failure.message,
          );
        },
      );
    } catch (e, stackTrace) {
      print('❌ Exception creating BLAN: $e');
      print('❌ Stack trace: $stackTrace');
      state = state.copyWith(
        isSubmitting: false,
        errorMessage: 'An unexpected error occurred. Please try again.',
      );
    }
  }

  /// Reset the state to initial values
  void reset() {
    print('🔄 Resetting BLAN creation state');
    state = BlanCreationState(
      data: BlanCreationRequest(
        // Category will be set from backend categories
        mood: Mood.chill,
        groupSize: GroupSize.plusOne,
        genderPref: GenderPreference.any,
        billPolicy: BillPolicy.decideLater,
        visibility: VisibilityEnum.public,
        // Default to today evening (6 PM)
        dateTime: _getDefaultDateTime(),
      ),
    );
    // Re-set default category from backend when available
    _setDefaultCategory();
    print('   ✅ State reset complete');
  }
}

final createBlanProvider =
    StateNotifierProvider<CreateBlanNotifier, BlanCreationState>((ref) {
  return CreateBlanNotifier(ref);
});

