import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../user/application/current_user_provider.dart';
import '../data/my_blans_repository.dart';
import '../models/blan_for_my_blans.dart';
import '../models/activity_filter.dart';

/// Main tab selection for My BLANs
enum MyBlansMainTab {
  created,
  myActivity,
}

class MyBlansV2State {
  const MyBlansV2State({
    this.createdBlans = const [],
    this.myActivityData,
    this.isLoading = false,
    this.error,
    this.selectedMainTab = MyBlansMainTab.created,
    this.selectedActivityFilter = ActivityFilter.accepted,
  });

  final List<BlanForMyBlans> createdBlans;
  final MyActivityData? myActivityData;
  final bool isLoading;
  final String? error;
  final MyBlansMainTab selectedMainTab;
  final ActivityFilter selectedActivityFilter;

  MyBlansV2State copyWith({
    List<BlanForMyBlans>? createdBlans,
    MyActivityData? myActivityData,
    bool? isLoading,
    String? error,
    MyBlansMainTab? selectedMainTab,
    ActivityFilter? selectedActivityFilter,
  }) {
    return MyBlansV2State(
      createdBlans: createdBlans ?? this.createdBlans,
      myActivityData: myActivityData ?? this.myActivityData,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedMainTab: selectedMainTab ?? this.selectedMainTab,
      selectedActivityFilter: selectedActivityFilter ?? this.selectedActivityFilter,
    );
  }
}

class MyBlansV2Notifier extends StateNotifier<MyBlansV2State> {
  MyBlansV2Notifier(this._repository, this._ref)
      : super(const MyBlansV2State()) {
    loadAll();
  }

  final MyBlansRepository _repository;
  final Ref _ref;

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    
    final user = _ref.read(currentUserProvider);
    if (user == null) {
      state = state.copyWith(
        isLoading: false,
        error: 'User not authenticated',
      );
      return;
    }

    try {
      // Load created BLANs and my activity in parallel
      final createdResult = await _repository.getCreatedBlans(userId: user.id);
      final activityResult = await _repository.getMyActivity(userId: user.id);

      final created = createdResult.when(
        success: (blans) => blans,
        failure: (failure) {
          print('❌ Failed to load created blans: ${failure.message}');
          return <BlanForMyBlans>[];
        },
      );

      final activity = activityResult.when(
        success: (data) => data,
        failure: (failure) {
          print('❌ Failed to load my activity: ${failure.message}');
          return null;
        },
      );

      final hasError = !createdResult.isSuccess || !activityResult.isSuccess;

      state = state.copyWith(
        createdBlans: created,
        myActivityData: activity,
        isLoading: false,
        error: hasError
            ? 'Some data failed to load. Please try again.'
            : null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  void selectMainTab(MyBlansMainTab tab) {
    state = state.copyWith(selectedMainTab: tab);
  }

  void selectActivityFilter(ActivityFilter filter) {
    state = state.copyWith(selectedActivityFilter: filter);
  }

  List<BlanForMyBlans> getCurrentActivityList() {
    final data = state.myActivityData;
    if (data == null) return [];

    switch (state.selectedActivityFilter) {
      case ActivityFilter.accepted:
        return data.accepted;
      case ActivityFilter.pending:
        return data.pending;
      case ActivityFilter.notSelected:
        return data.notSelected;
    }
  }
}

final myBlansV2Provider =
    StateNotifierProvider<MyBlansV2Notifier, MyBlansV2State>((ref) {
  final repository = MyBlansRepository();
  return MyBlansV2Notifier(repository, ref);
});

