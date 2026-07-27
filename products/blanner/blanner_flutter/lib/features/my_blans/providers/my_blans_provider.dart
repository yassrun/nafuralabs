import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../user/application/current_user_provider.dart';
import '../data/my_blans_repository.dart';
import '../models/my_blan.dart';

final myBlansRepositoryProvider = Provider<MyBlansRepository>((ref) {
  return MyBlansRepository();
});

class MyBlansState {
  const MyBlansState({
    this.createdBlans = const [],
    this.participatingBlans = const [],
    this.pendingRequests = const [],
    this.isLoading = false,
    this.error,
    this.selectedTab = MyBlansTab.created,
  });

  final List<MyBlan> createdBlans;
  final List<MyBlan> participatingBlans;
  final List<MyBlan> pendingRequests;
  final bool isLoading;
  final String? error;
  final MyBlansTab selectedTab;

  MyBlansState copyWith({
    List<MyBlan>? createdBlans,
    List<MyBlan>? participatingBlans,
    List<MyBlan>? pendingRequests,
    bool? isLoading,
    String? error,
    MyBlansTab? selectedTab,
  }) {
    return MyBlansState(
      createdBlans: createdBlans ?? this.createdBlans,
      participatingBlans: participatingBlans ?? this.participatingBlans,
      pendingRequests: pendingRequests ?? this.pendingRequests,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedTab: selectedTab ?? this.selectedTab,
    );
  }
}

enum MyBlansTab {
  created,
  participating,
  requests,
}

class MyBlansNotifier extends StateNotifier<MyBlansState> {
  MyBlansNotifier(this._repository, this._ref)
      : super(const MyBlansState()) {
    loadAll();
  }

  final MyBlansRepository _repository;
  final Ref _ref;

  Future<void> loadAll() async {
    state = state.copyWith(isLoading: true, error: null);
    
    // Get current user ID
    final user = _ref.read(currentUserProvider);
    if (user == null) {
      state = state.copyWith(
        isLoading: false,
        error: 'User not authenticated',
      );
      return;
    }

    try {
      // Call all three endpoints in parallel
      final createdResult = await _repository.getMyCreatedBlans(
        userId: user.id,
      );
      final participatingResult = await _repository.getMyParticipatingBlans(
        userId: user.id,
      );
      final pendingResult = await _repository.getMyPendingRequests(
        userId: user.id,
      );

      // Process results
      final created = createdResult.when(
        success: (blans) => blans,
        failure: (failure) {
          print('❌ Failed to load created blans: ${failure.message}');
          return <MyBlan>[];
        },
      );

      final participating = participatingResult.when(
        success: (blans) => blans,
        failure: (failure) {
          print('❌ Failed to load participating blans: ${failure.message}');
          return <MyBlan>[];
        },
      );

      final pending = pendingResult.when(
        success: (blans) => blans,
        failure: (failure) {
          print('❌ Failed to load pending requests: ${failure.message}');
          return <MyBlan>[];
        },
      );

      // Check if any request failed
      final hasError = !createdResult.isSuccess ||
          !participatingResult.isSuccess ||
          !pendingResult.isSuccess;

      state = state.copyWith(
        createdBlans: created,
        participatingBlans: participating,
        pendingRequests: pending,
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

  void selectTab(MyBlansTab tab) {
    state = state.copyWith(selectedTab: tab);
  }

  Future<void> acceptRequest(String requestId) async {
    try {
      await _repository.acceptRequest(requestId);
      // Reload to refresh pending requests count
      await loadAll();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> rejectRequest(String requestId) async {
    try {
      await _repository.rejectRequest(requestId);
      // Reload to refresh pending requests count
      await loadAll();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

final myBlansProvider =
    StateNotifierProvider<MyBlansNotifier, MyBlansState>((ref) {
  final repository = ref.watch(myBlansRepositoryProvider);
  return MyBlansNotifier(repository, ref);
});

