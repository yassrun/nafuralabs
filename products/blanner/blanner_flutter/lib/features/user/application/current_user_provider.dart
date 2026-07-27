import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/entities/user.dart';
import '../domain/enums/gender.dart';

/// Mock test users for development and testing
/// This will be replaced with real authentication later
final User _mockUser1 = User(
  id: '550e8400-e29b-41d4-a716-446655440000', // Mock UUID
  name: 'Alex Johnson',
  username: '+1234567890',
  email: 'alex.johnson@example.com',
  phone: '+1234567890',
  phoneVerified: true,
  bio: 'Social planner enthusiast. Love organizing events and bringing people together!',
  photoUrl: null,
  avatarUrl: null,
  gender: Gender.other,
  birthdate: DateTime(1995, 6, 15),
  city: 'San Francisco',
  interests: 'Events, Social Planning, Technology, Travel',
  verifiedFlag: true,
  createdAt: DateTime(2024, 1, 1, 10, 30),
  updatedAt: DateTime(2024, 11, 15, 14, 20),
);

final User _mockUser2 = User(
  id: '660e8400-e29b-41d4-a716-446655440001', // Mock UUID
  name: 'Sarah Martinez',
  username: '+1987654321',
  email: 'sarah.martinez@example.com',
  phone: '+1987654321',
  phoneVerified: true,
  bio: 'Fitness enthusiast and coffee lover. Always up for new adventures!',
  photoUrl: null,
  avatarUrl: null,
  gender: Gender.female,
  birthdate: DateTime(1992, 3, 22),
  city: 'New York',
  interests: 'Fitness, Coffee, Hiking, Photography',
  verifiedFlag: true,
  createdAt: DateTime(2024, 2, 10, 9, 15),
  updatedAt: DateTime(2024, 11, 20, 16, 45),
);

/// State for managing which mock user is active
class MockUserState {
  final int? selectedUserIndex; // null = no user, 0 for user1, 1 for user2

  const MockUserState({this.selectedUserIndex});

  User? get currentUser {
    if (selectedUserIndex == null) return null;
    return selectedUserIndex == 0 ? _mockUser1 : _mockUser2;
  }

  MockUserState copyWith({int? selectedUserIndex}) {
    return MockUserState(
      selectedUserIndex: selectedUserIndex,
    );
  }
}

/// Notifier for switching between mock users
class MockUserNotifier extends StateNotifier<MockUserState> {
  MockUserNotifier() : super(const MockUserState(selectedUserIndex: null));

  void switchToUser1() {
    state = state.copyWith(selectedUserIndex: 0);
  }

  void switchToUser2() {
    state = state.copyWith(selectedUserIndex: 1);
  }

  void toggleUser() {
    final current = state.selectedUserIndex;
    if (current == null) {
      state = state.copyWith(selectedUserIndex: 0);
    } else {
      state = state.copyWith(
        selectedUserIndex: current == 0 ? 1 : 0,
      );
    }
  }
}

/// Provider for managing mock user selection
final mockUserNotifierProvider =
    StateNotifierProvider<MockUserNotifier, MockUserState>((ref) {
  return MockUserNotifier();
});

/// Provider for the currently connected/logged-in user
/// For now, returns a mock user. Will be replaced with real auth later.
final currentUserProvider = Provider<User?>((ref) {
  // TODO: Replace with real authentication when auth is implemented
  // For now, return mock user for testing
  final mockUserState = ref.watch(mockUserNotifierProvider);
  return mockUserState.currentUser;
});

/// Provider that throws if no user is connected
/// Use this when you need a guaranteed user (e.g., in authenticated routes)
final requireCurrentUserProvider = Provider<User>((ref) {
  final user = ref.watch(currentUserProvider);
  if (user == null) {
    throw Exception('No user is currently connected');
  }
  return user;
});

