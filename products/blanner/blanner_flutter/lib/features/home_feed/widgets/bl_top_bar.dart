import 'package:flutter/material.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';

class BlTopBar extends StatelessWidget implements PreferredSizeWidget {
  const BlTopBar({
    super.key,
    required this.title,
    this.onSearchTap,
  });

  final String title;
  final VoidCallback? onSearchTap;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: BlannerColors.background,
      elevation: 0,
      leading: Padding(
        padding: const EdgeInsets.all(BlannerSpacing.sm),
        child: Container(
          decoration: BoxDecoration(
            color: BlannerColors.primary,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              'B',
              style: BlannerTextStyles.headline2.copyWith(
                color: BlannerColors.surface,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ),
      title: Text(
        title,
        style: BlannerTextStyles.headline2,
      ),
      centerTitle: true,
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: onSearchTap,
          color: BlannerColors.textPrimary,
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

