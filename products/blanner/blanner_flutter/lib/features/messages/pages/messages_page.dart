import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';

class MessagesPage extends ConsumerWidget {
  const MessagesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: BlannerColors.background,
      appBar: AppBar(
        title: Text(
          'Messages',
          style: BlannerTextStyles.headline2,
        ),
        backgroundColor: BlannerColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: BlannerColors.textSecondary,
            ),
            const SizedBox(height: BlannerSpacing.lg),
            Text(
              'No messages yet',
              style: BlannerTextStyles.headline2,
            ),
            const SizedBox(height: BlannerSpacing.sm),
            Text(
              'Your conversations will appear here',
              style: BlannerTextStyles.body2.copyWith(
                color: BlannerColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

