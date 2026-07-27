import 'package:flutter/material.dart';

import '../typography.dart';

class BlannerLogo extends StatelessWidget {
  const BlannerLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Text('Blanner', style: BlannerTextStyles.logo);
  }
}
