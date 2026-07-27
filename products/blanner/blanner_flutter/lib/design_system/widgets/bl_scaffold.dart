import 'package:flutter/material.dart';

import '../colors.dart';
import '../spacing.dart';

class BlannerScaffold extends StatelessWidget {
  const BlannerScaffold({
    super.key,
    this.appBar,
    required this.body,
    this.padding = const EdgeInsets.symmetric(
      horizontal: BlannerSpacing.lg,
      vertical: BlannerSpacing.lg,
    ),
    this.bottomNavigationBar,
  });

  final PreferredSizeWidget? appBar;
  final Widget body;
  final EdgeInsetsGeometry padding;
  final Widget? bottomNavigationBar;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: BlannerColors.background,
      appBar: appBar,
      body: SafeArea(
        child: Padding(padding: padding, child: body),
      ),
      bottomNavigationBar: bottomNavigationBar,
    );
  }
}
