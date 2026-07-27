import 'package:flutter/material.dart';

import '../colors.dart';
import '../radius.dart';
import '../spacing.dart';
import '../typography.dart';

class BlSocialButton extends StatelessWidget {
  const BlSocialButton({
    super.key,
    required this.label,
    required this.onPressed,
    required this.icon,
    this.backgroundColor = BlannerColors.surface,
    this.foregroundColor = BlannerColors.textPrimary,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget icon;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          padding: const EdgeInsets.symmetric(
            vertical: BlannerSpacing.md,
            horizontal: BlannerSpacing.md,
          ),
          side: BorderSide(color: foregroundColor.withValues(alpha: 0.1)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(BlannerRadius.medium),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            icon,
            const SizedBox(width: BlannerSpacing.sm),
            Text(
              label,
              style: BlannerTextStyles.button.copyWith(color: foregroundColor),
            ),
          ],
        ),
      ),
    );
  }
}
