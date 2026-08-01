import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/navigation/pages/main_navigation_page.dart';
import '../../features/splash/pages/splash_page.dart';
import '../../features/user/application/current_user_provider.dart';
import '../../features/user/domain/entities/user.dart';
import '../../features/user/presentation/pages/login_page.dart';

enum AppRoute {
  splash('/splash'),
  login('/login'),
  main('/'),
  homeFeed('/home'),
  messages('/messages'),
  myBlans('/my-blans'),
  profile('/profile');

  const AppRoute(this.path);
  final String path;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  // Use read instead of watch to avoid recreating router on user changes
  // The redirect will read the current user state when needed
  final router = GoRouter(
    initialLocation: AppRoute.splash.path,
    routes: [
      GoRoute(
        path: AppRoute.splash.path,
        name: AppRoute.splash.name,
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: AppRoute.login.path,
        name: AppRoute.login.name,
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: AppRoute.main.path,
        name: AppRoute.main.name,
        builder: (context, state) => const MainNavigationPage(),
      ),
      GoRoute(
        path: AppRoute.homeFeed.path,
        name: AppRoute.homeFeed.name,
        builder: (context, state) => const MainNavigationPage(),
      ),
      GoRoute(
        path: AppRoute.messages.path,
        name: AppRoute.messages.name,
        builder: (context, state) => const MainNavigationPage(),
      ),
      GoRoute(
        path: AppRoute.myBlans.path,
        name: AppRoute.myBlans.name,
        builder: (context, state) => const MainNavigationPage(),
      ),
      GoRoute(
        path: AppRoute.profile.path,
        name: AppRoute.profile.name,
        builder: (context, state) => const MainNavigationPage(),
      ),
    ],
    redirect: (context, state) {
      final location = state.matchedLocation;
      // Read user state at redirect time (not watched, so router doesn't rebuild)
      final user = ref.read(currentUserProvider);
      
      // If on splash or login, allow navigation
      if (location == AppRoute.splash.path || location == AppRoute.login.path) {
        return null;
      }
      
      // If user is not connected and trying to access protected routes, redirect to login
      if (user == null && location != AppRoute.login.path) {
        return AppRoute.login.path;
      }
      
      // If user is connected and on login page, redirect to home
      if (user != null && location == AppRoute.login.path) {
        return AppRoute.homeFeed.path;
      }
      
      return null;
    },
    refreshListenable: _RouterRefreshNotifier(ref),
    debugLogDiagnostics: kDebugMode,
  );

  return router;
});

/// Notifier to trigger router refresh when user state changes
class _RouterRefreshNotifier extends ChangeNotifier {
  _RouterRefreshNotifier(this._ref) {
    _ref.listen<User?>(currentUserProvider, (previous, next) {
      // User state changed, notify router to check redirects
      notifyListeners();
    });
  }

  final Ref _ref;
}
