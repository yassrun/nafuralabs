import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/entities/user.dart';
import 'current_user_provider.dart';

/// Controller for managing the current user state
/// For now, manages mock user. Will be replaced with real auth later.
class UserController extends StateNotifier<User?> {
  UserController(this._ref) : super(_getInitialUser(_ref)) {
    // Listen to mock user changes
    _ref.listen(mockUserNotifierProvider, (previous, next) {
      state = next.currentUser;
    });
  }

  final Ref _ref;

  static User? _getInitialUser(Ref ref) {
    final mockUserState = ref.read(mockUserNotifierProvider);
    return mockUserState.currentUser;
  }

  /// Update the current user
  void updateUser(User user) {
    state = user;
  }

  /// Update specific user fields
  void updateUserFields({
    String? name,
    String? email,
    String? phone,
    String? bio,
    String? photoUrl,
    String? avatarUrl,
    String? city,
    String? interests,
  }) {
    if (state == null) return;
    state = state!.copyWith(
      name: name,
      email: email,
      phone: phone,
      bio: bio,
      photoUrl: photoUrl,
      avatarUrl: avatarUrl,
      city: city,
      interests: interests,
      updatedAt: DateTime.now(),
    );
  }

  /// Clear the current user (for logout)
  void clearUser() {
    // TODO: When real auth is implemented, this will sign out
    state = null;
  }

  /// Get the current user
  User? get currentUser => state;
}

/// Provider for the user controller
final userControllerProvider =
    StateNotifierProvider<UserController, User?>((ref) {
  return UserController(ref);
});

