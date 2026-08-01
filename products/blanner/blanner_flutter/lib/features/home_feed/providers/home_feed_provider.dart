import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../user/application/current_user_provider.dart';
import '../data/blan_model.dart';
import '../data/blan_repository.dart';
import '../data/reaction_service.dart';
import '../data/participation_service.dart';
import '../data/participation_status.dart';

final blanRepositoryProvider = Provider<BlanRepository>((ref) {
  return BlanRepository();
});

final reactionServiceProvider = Provider<ReactionService>((ref) {
  return ReactionService();
});

final participationServiceProvider = Provider<ParticipationService>((ref) {
  return ParticipationService();
});

class HomeFeedState {
  const HomeFeedState({
    required this.blans,
    required this.selectedFilter,
    this.isLoading = false,
    this.error,
  });

  final List<Blan> blans;
  final String? selectedFilter;
  final bool isLoading;
  final String? error;

  HomeFeedState copyWith({
    List<Blan>? blans,
    String? selectedFilter,
    bool? isLoading,
    String? error,
  }) {
    return HomeFeedState(
      blans: blans ?? this.blans,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class HomeFeedNotifier extends StateNotifier<HomeFeedState> {
  HomeFeedNotifier(
    this._repository,
    this._reactionService,
    this._participationService,
    this._ref,
  ) : super(
          const HomeFeedState(
            blans: [],
            selectedFilter: 'Trending',
          ),
        ) {
    loadBlans();
  }

  final BlanRepository _repository;
  final ReactionService _reactionService;
  final ParticipationService _participationService;
  final Ref _ref;
  List<Blan> _allBlans = [];

  Future<void> loadBlans({
    String? filter,
    double? lat,
    double? lng,
    int page = 0,
    bool append = false,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // Get current user ID
      final user = _ref.read(currentUserProvider);
      if (user == null) {
        state = state.copyWith(
          isLoading: false,
          error: 'User not authenticated',
        );
        return;
      }

      final result = await _repository.getBlansFeed(
        userId: user.id,
        lat: lat,
        lng: lng,
        page: page,
        size: 20,
        filter: filter ?? 'Trending',
      );
      
      result.when(
        success: (paginatedBlans) {
          if (append && page > 0) {
            // Append to existing list for pagination
            _allBlans = [..._allBlans, ...paginatedBlans.content];
            state = state.copyWith(
              blans: [...state.blans, ...paginatedBlans.content],
              selectedFilter: filter ?? 'Trending',
              isLoading: false,
            );
          } else {
            // Replace list (first page or refresh)
            _allBlans = paginatedBlans.content;
            state = state.copyWith(
              blans: paginatedBlans.content,
              selectedFilter: filter ?? 'Trending',
              isLoading: false,
            );
          }
        },
        failure: (failure) {
          state = state.copyWith(
            isLoading: false,
            error: failure.message,
          );
        },
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> toggleLike(String id) async {
    // Find the blan to get original values
    final originalBlan = state.blans.firstWhere(
      (blan) => blan.id == id,
      orElse: () => _allBlans.firstWhere((blan) => blan.id == id),
    );

    final originalUserLiked = originalBlan.userLiked;
    final originalLikeCount = originalBlan.likeCount;

    // Optimistic update: instantly update UI
    final optimisticUserLiked = !originalUserLiked;
    final optimisticLikeCount = optimisticUserLiked
        ? originalLikeCount + 1
        : (originalLikeCount > 0 ? originalLikeCount - 1 : 0);

    final optimisticBlans = state.blans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          userLiked: optimisticUserLiked,
          likeCount: optimisticLikeCount,
        );
      }
      return blan;
    }).toList();

    // Update in _allBlans too
    _allBlans = _allBlans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          userLiked: optimisticUserLiked,
          likeCount: optimisticLikeCount,
        );
      }
      return blan;
    }).toList();

    state = state.copyWith(blans: optimisticBlans);

    // Call API
    try {
      final result = await _reactionService.toggleLike(id);
      result.when(
        success: (response) {
          // Update with server response
          final updatedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userLiked: response.userLiked,
                likeCount: response.likeCount,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userLiked: response.userLiked,
                likeCount: response.likeCount,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: updatedBlans);
        },
        failure: (failure) {
          // Revert optimistic update on failure
          print('❌ Failed to toggle like, reverting: $failure');
          final revertedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userLiked: originalUserLiked,
                likeCount: originalLikeCount,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userLiked: originalUserLiked,
                likeCount: originalLikeCount,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: revertedBlans);
        },
      );
    } catch (e) {
      // Revert on exception
      print('❌ Exception toggling like, reverting: $e');
      final revertedBlans = state.blans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            userLiked: originalUserLiked,
            likeCount: originalLikeCount,
          );
        }
        return blan;
      }).toList();

      _allBlans = _allBlans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            userLiked: originalUserLiked,
            likeCount: originalLikeCount,
          );
        }
        return blan;
      }).toList();

      state = state.copyWith(blans: revertedBlans);
    }
  }

  Future<void> toggleSave(String id) async {
    // Find the blan to get original values
    final originalBlan = state.blans.firstWhere(
      (blan) => blan.id == id,
      orElse: () => _allBlans.firstWhere((blan) => blan.id == id),
    );

    final originalUserSaved = originalBlan.userSaved;
    final originalSaveCount = originalBlan.saveCount;

    // Optimistic update: instantly update UI
    final optimisticUserSaved = !originalUserSaved;
    final optimisticSaveCount = optimisticUserSaved
        ? originalSaveCount + 1
        : (originalSaveCount > 0 ? originalSaveCount - 1 : 0);

    final optimisticBlans = state.blans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          userSaved: optimisticUserSaved,
          saveCount: optimisticSaveCount,
        );
      }
      return blan;
    }).toList();

    // Update in _allBlans too
    _allBlans = _allBlans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          userSaved: optimisticUserSaved,
          saveCount: optimisticSaveCount,
        );
      }
      return blan;
    }).toList();

    state = state.copyWith(blans: optimisticBlans);

    // Call API
    try {
      final result = await _reactionService.toggleSave(id);
      result.when(
        success: (response) {
          // Update with server response
          final updatedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userSaved: response.userSaved,
                saveCount: response.saveCount,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userSaved: response.userSaved,
                saveCount: response.saveCount,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: updatedBlans);
        },
        failure: (failure) {
          // Revert optimistic update on failure
          print('❌ Failed to toggle save, reverting: $failure');
          final revertedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userSaved: originalUserSaved,
                saveCount: originalSaveCount,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                userSaved: originalUserSaved,
                saveCount: originalSaveCount,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: revertedBlans);
        },
      );
    } catch (e) {
      // Revert on exception
      print('❌ Exception toggling save, reverting: $e');
      final revertedBlans = state.blans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            userSaved: originalUserSaved,
            saveCount: originalSaveCount,
          );
        }
        return blan;
      }).toList();

      _allBlans = _allBlans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            userSaved: originalUserSaved,
            saveCount: originalSaveCount,
          );
        }
        return blan;
      }).toList();

      state = state.copyWith(blans: revertedBlans);
    }
  }

  Future<void> requestJoin(String id) async {
    // Get current user ID
    final user = _ref.read(currentUserProvider);
    if (user == null) {
      print('❌ Cannot join: User not authenticated');
      return;
    }

    // Find the blan to get original values
    final originalBlan = state.blans.firstWhere(
      (blan) => blan.id == id,
      orElse: () => _allBlans.firstWhere((blan) => blan.id == id),
    );

    final originalStatus = originalBlan.status;
    final originalParticipants = originalBlan.currentParticipants;

    // Only allow joining if status is notRequested or left
    if (originalStatus != ParticipationStatus.notRequested && 
        originalStatus != ParticipationStatus.left) {
      print('⚠️ Cannot join: Already participating or requested');
      return;
    }

    // Optimistic update: instantly update UI
    final optimisticStatus = ParticipationStatus.requested;
    final optimisticParticipants = originalParticipants + 1;

    final optimisticBlans = state.blans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          status: optimisticStatus,
          currentParticipants: optimisticParticipants,
        );
      }
      return blan;
    }).toList();

    // Update in _allBlans too
    _allBlans = _allBlans.map((blan) {
      if (blan.id == id) {
        return blan.copyWith(
          status: optimisticStatus,
          currentParticipants: optimisticParticipants,
        );
      }
      return blan;
    }).toList();

    state = state.copyWith(blans: optimisticBlans);

    // Call API
    try {
      final result = await _participationService.createParticipation(id, user.id);
      result.when(
        success: (response) {
          // Update with server response
          final updatedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                status: response.participationStatus,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                status: response.participationStatus,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: updatedBlans);
          print('✅ Participation request created successfully');
        },
        failure: (failure) {
          // Revert optimistic update on failure
          print('❌ Failed to create participation, reverting: $failure');
          final revertedBlans = state.blans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                status: originalStatus,
                currentParticipants: originalParticipants,
              );
            }
            return blan;
          }).toList();

          _allBlans = _allBlans.map((blan) {
            if (blan.id == id) {
              return blan.copyWith(
                status: originalStatus,
                currentParticipants: originalParticipants,
              );
            }
            return blan;
          }).toList();

          state = state.copyWith(blans: revertedBlans);
        },
      );
    } catch (e) {
      // Revert on exception
      print('❌ Exception creating participation, reverting: $e');
      final revertedBlans = state.blans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            status: originalStatus,
            currentParticipants: originalParticipants,
          );
        }
        return blan;
      }).toList();

      _allBlans = _allBlans.map((blan) {
        if (blan.id == id) {
          return blan.copyWith(
            status: originalStatus,
            currentParticipants: originalParticipants,
          );
        }
        return blan;
      }).toList();

      state = state.copyWith(blans: revertedBlans);
    }
  }
}

final homeFeedProvider =
    StateNotifierProvider<HomeFeedNotifier, HomeFeedState>((ref) {
  final repository = ref.watch(blanRepositoryProvider);
  final reactionService = ref.watch(reactionServiceProvider);
  final participationService = ref.watch(participationServiceProvider);
  return HomeFeedNotifier(repository, reactionService, participationService, ref);
});

