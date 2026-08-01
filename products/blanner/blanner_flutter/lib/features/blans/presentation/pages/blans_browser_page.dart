import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../../../../design_system/widgets/bl_logo.dart';
import '../../../../design_system/widgets/bl_scaffold.dart';
import '../../../user/application/current_user_provider.dart';

class BlansBrowserPage extends ConsumerWidget {
  const BlansBrowserPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    return BlannerScaffold(
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const BlannerLogo(),
          const SizedBox(height: BlannerSpacing.xl),
          Text(
            'Blans Browser',
            style: BlannerTextStyles.headline1,
          ),
          const SizedBox(height: BlannerSpacing.md),
          if (user != null) ...[
            Text(
              'Welcome, ${user.name}!',
              style: BlannerTextStyles.subtitle1,
            ),
            const SizedBox(height: BlannerSpacing.lg),
            Text(
              'Browse and discover blans here.',
              style: BlannerTextStyles.body1,
            ),
          ] else ...[
            Text(
              'Please connect to browse blans.',
              style: BlannerTextStyles.body1,
            ),
          ],
        ],
      ),
    );
  }
}

