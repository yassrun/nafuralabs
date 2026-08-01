class Validators {
  Validators._();

  static String? phoneNumber(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'Phone number is required';
    }
    if (trimmed.length < 8) {
      return 'Enter a valid phone number';
    }
    return null;
  }

  static String? otpCode(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.length != 6) {
      return 'Enter the 6-digit code';
    }
    if (int.tryParse(trimmed) == null) {
      return 'Code must be numeric';
    }
    return null;
  }
}
