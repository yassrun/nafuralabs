import 'package:flutter/material.dart';

import '../spacing.dart';
import '../typography.dart';

class BlTextField extends StatelessWidget {
  const BlTextField({
    super.key,
    required this.controller,
    this.label,
    this.hintText,
    this.keyboardType,
    this.obscureText = false,
    this.validator,
    this.prefix,
    this.suffix,
    this.maxLength,
    this.maxLines = 1,
    this.textInputAction,
    this.onSubmitted,
    this.onChanged,
  });

  final TextEditingController controller;
  final String? label;
  final String? hintText;
  final TextInputType? keyboardType;
  final bool obscureText;
  final String? Function(String?)? validator;
  final Widget? prefix;
  final Widget? suffix;
  final int? maxLength;
  final int? maxLines;
  final TextInputAction? textInputAction;
  final void Function(String value)? onSubmitted;
  final void Function(String value)? onChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(label!, style: BlannerTextStyles.subtitle2),
          const SizedBox(height: BlannerSpacing.xs),
        ],
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          validator: validator,
          maxLength: maxLength,
          maxLines: maxLines,
          textInputAction: textInputAction,
          onFieldSubmitted: onSubmitted,
          onChanged: onChanged,
          decoration: InputDecoration(
            hintText: hintText,
            counterText: '',
            prefixIcon: prefix,
            suffixIcon: suffix,
          ),
        ),
      ],
    );
  }
}
