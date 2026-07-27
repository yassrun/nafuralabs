import 'package:flutter/material.dart';

import 'colors.dart';
import 'radius.dart';
import 'spacing.dart';
import 'typography.dart';

ThemeData buildBlannerTheme() {
  final colorScheme =
      ColorScheme.fromSeed(
        seedColor: BlannerColors.primary,
        brightness: Brightness.light,
      ).copyWith(
        surface: BlannerColors.surface,
        secondary: BlannerColors.secondary,
        error: BlannerColors.error,
        onSecondary: BlannerColors.textPrimary,
        onSurface: BlannerColors.textPrimary,
        onPrimary: BlannerColors.surface,
      );

  final base = ThemeData(
    colorScheme: colorScheme,
    useMaterial3: true,
    scaffoldBackgroundColor: BlannerColors.background,
    textTheme: TextTheme(
      displayLarge: BlannerTextStyles.headline1,
      displayMedium: BlannerTextStyles.headline2,
      titleLarge: BlannerTextStyles.subtitle1,
      titleMedium: BlannerTextStyles.subtitle2,
      bodyLarge: BlannerTextStyles.body1,
      bodyMedium: BlannerTextStyles.body2,
      labelLarge: BlannerTextStyles.button,
    ),
  );

  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: BlannerColors.background,
      foregroundColor: BlannerColors.textPrimary,
      elevation: 0,
      titleTextStyle: BlannerTextStyles.subtitle1,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: BlannerColors.primary,
        foregroundColor: BlannerColors.surface,
        textStyle: BlannerTextStyles.button,
        padding: const EdgeInsets.symmetric(
          vertical: BlannerSpacing.sm,
          horizontal: BlannerSpacing.lg,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(BlannerRadius.medium),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: BlannerColors.primary,
        textStyle: BlannerTextStyles.button,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: BlannerColors.surface,
      contentPadding: const EdgeInsets.symmetric(
        vertical: BlannerSpacing.sm,
        horizontal: BlannerSpacing.md,
      ),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        borderSide: BorderSide(
          color: BlannerColors.textSecondary.withValues(alpha: 0.2),
        ),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        borderSide: const BorderSide(color: BlannerColors.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        borderSide: const BorderSide(color: BlannerColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(BlannerRadius.medium),
        borderSide: const BorderSide(color: BlannerColors.error, width: 1.5),
      ),
      labelStyle: BlannerTextStyles.body2,
      errorStyle: BlannerTextStyles.caption.copyWith(
        color: BlannerColors.error,
      ),
    ),
  );
}
