enum Gender {
  male,
  female,
  other,
  preferNotToSay;

  static Gender? fromString(String? value) {
    if (value == null) return null;
    try {
      return Gender.values.firstWhere(
        (e) => e.name.toLowerCase() == value.toLowerCase(),
      );
    } catch (e) {
      return null;
    }
  }

  String toJson() => name;
}

