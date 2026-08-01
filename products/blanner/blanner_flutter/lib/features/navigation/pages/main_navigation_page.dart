import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/routing/app_router.dart';
import '../../../../design_system/colors.dart';
import '../../home_feed/pages/home_feed_page.dart';
import '../../messages/pages/messages_page.dart';
import '../../my_blans/pages/my_blans_page_v2.dart';
import '../../my_blans/providers/my_blans_v2_provider.dart';
import '../../profile/pages/profile_page.dart';

class MainNavigationPage extends ConsumerStatefulWidget {
  const MainNavigationPage({super.key});

  @override
  ConsumerState<MainNavigationPage> createState() =>
      _MainNavigationPageState();
}

class _MainNavigationPageState extends ConsumerState<MainNavigationPage> {
  final List<Widget> _pages = const [
    HomeFeedPage(),
    MessagesPage(),
    MyBlansPageV2(),
    ProfilePage(),
  ];

  int _getCurrentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    
    if (location == AppRoute.homeFeed.path || location == AppRoute.main.path) {
      return 0;
    } else if (location == AppRoute.messages.path) {
      return 1;
    } else if (location == AppRoute.myBlans.path) {
      return 2;
    } else if (location == AppRoute.profile.path) {
      return 3;
    }
    // Default to home
    return 0;
  }

  void _onTabTapped(int index) {
    final currentIndex = _getCurrentIndex(context);
    if (currentIndex == index) return; // Already on this tab

    // Update URL based on selected tab
    switch (index) {
      case 0:
        context.go(AppRoute.homeFeed.path);
        break;
      case 1:
        context.go(AppRoute.messages.path);
        break;
      case 2:
        context.go(AppRoute.myBlans.path);
        break;
      case 3:
        context.go(AppRoute.profile.path);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _getCurrentIndex(context);
    // Get notification counts from providers
    final myBlansState = ref.watch(myBlansV2Provider);
    final hasPendingRequests = myBlansState.createdBlans
        .any((blan) => blan.pendingRequestsCount > 0);
    // TODO: Get unread messages count from messages provider when available
    final hasUnreadMessages = false; // Placeholder
    
    return Scaffold(
      body: IndexedStack(
        index: currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: _buildBottomNavigationBar(
        currentIndex,
        hasUnreadMessages: hasUnreadMessages,
        hasPendingRequests: hasPendingRequests,
      ),
    );
  }

  Widget _buildIconWithBadge({
    required IconData icon,
    required IconData activeIcon,
    required bool hasNotification,
  }) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon),
        if (hasNotification)
          Positioned(
            right: -6,
            top: -6,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildBottomNavigationBar(
    int currentIndex, {
    required bool hasUnreadMessages,
    required bool hasPendingRequests,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: BlannerColors.background,
        boxShadow: [
          BoxShadow(
            color: BlannerColors.textSecondary.withValues(alpha: 0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: BottomNavigationBar(
          currentIndex: currentIndex,
          onTap: _onTabTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: BlannerColors.background,
          selectedItemColor: BlannerColors.primary,
          unselectedItemColor: BlannerColors.textSecondary,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          elevation: 0,
          items: [
            const BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: _buildIconWithBadge(
                icon: Icons.chat_bubble_outline,
                activeIcon: Icons.chat_bubble,
                hasNotification: hasUnreadMessages,
              ),
              activeIcon: _buildIconWithBadge(
                icon: Icons.chat_bubble,
                activeIcon: Icons.chat_bubble,
                hasNotification: hasUnreadMessages,
              ),
              label: 'Messages',
            ),
            BottomNavigationBarItem(
              icon: _buildIconWithBadge(
                icon: Icons.event_note_outlined,
                activeIcon: Icons.event_note,
                hasNotification: hasPendingRequests,
              ),
              activeIcon: _buildIconWithBadge(
                icon: Icons.event_note,
                activeIcon: Icons.event_note,
                hasNotification: hasPendingRequests,
              ),
              label: 'My BLANs',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}

