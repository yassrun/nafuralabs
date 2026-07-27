import 'package:flutter/material.dart';

import '../colors.dart';
import '../radius.dart';
import '../spacing.dart';
import '../typography.dart';

class BlannerPrimaryButton extends StatelessWidget {
  const BlannerPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool isLoading;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return _BlannerButton(
      label: label,
      onPressed: onPressed,
      icon: icon,
      isLoading: isLoading,
      backgroundColor: BlannerColors.primary,
      foregroundColor: BlannerColors.surface,
      borderColor: Colors.transparent,
      fullWidth: fullWidth,
    );
  }
}

class BlannerSecondaryButton extends StatelessWidget {
  const BlannerSecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool isLoading;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return _BlannerButton(
      label: label,
      onPressed: onPressed,
      icon: icon,
      isLoading: isLoading,
      backgroundColor: BlannerColors.surface,
      foregroundColor: BlannerColors.primary,
      borderColor: BlannerColors.primary.withValues(alpha: 0.3),
      fullWidth: fullWidth,
    );
  }
}

class BlannerGhostButton extends StatelessWidget {
  const BlannerGhostButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.fullWidth = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool isLoading;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    return _BlannerButton(
      label: label,
      onPressed: onPressed,
      icon: icon,
      isLoading: isLoading,
      backgroundColor: Colors.transparent,
      foregroundColor: BlannerColors.textPrimary,
      borderColor: BlannerColors.textSecondary.withValues(alpha: 0.2),
      fullWidth: fullWidth,
    );
  }
}

class _BlannerButton extends StatelessWidget {
  const _BlannerButton({
    required this.label,
    required this.onPressed,
    required this.icon,
    required this.isLoading,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.borderColor,
    required this.fullWidth,
  });

  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool isLoading;
  final Color backgroundColor;
  final Color foregroundColor;
  final Color borderColor;
  final bool fullWidth;

  @override
  Widget build(BuildContext context) {
    final buttonChild = isLoading
        ? SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(foregroundColor),
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                icon!,
                const SizedBox(width: BlannerSpacing.sm),
              ],
              Text(
                label,
                style: BlannerTextStyles.button.copyWith(
                  color: foregroundColor,
                ),
              ),
            ],
          );

    return SizedBox(
      width: fullWidth ? double.infinity : null,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: foregroundColor,
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            vertical: BlannerSpacing.md,
            horizontal: BlannerSpacing.lg,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(BlannerRadius.medium),
            side: BorderSide(color: borderColor),
          ),
        ),
        child: buttonChild,
      ),
    );
  }
}
