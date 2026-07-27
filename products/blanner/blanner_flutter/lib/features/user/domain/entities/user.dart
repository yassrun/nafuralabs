import '../enums/gender.dart';

class User {
  const User({
    required this.id,
    required this.name,
    required this.username,
    this.email,
    this.phone,
    this.phoneVerified = false,
    this.bio,
    this.photoUrl,
    this.avatarUrl,
    this.gender,
    this.birthdate,
    this.city,
    this.interests,
    this.verifiedFlag = false,
    this.createdAt,
    this.updatedAt,
  });

  final String id; // UUID as String in Dart
  final String name;
  final String username; // Phone number
  final String? email;
  final String? phone;
  final bool phoneVerified;
  final String? bio;
  final String? photoUrl;
  final String? avatarUrl;
  final Gender? gender;
  final DateTime? birthdate; // LocalDate -> DateTime
  final String? city;
  final String? interests;
  final bool verifiedFlag;
  final DateTime? createdAt; // LocalDateTime -> DateTime
  final DateTime? updatedAt; // LocalDateTime -> DateTime

  User copyWith({
    String? id,
    String? name,
    String? username,
    String? email,
    String? phone,
    bool? phoneVerified,
    String? bio,
    String? photoUrl,
    String? avatarUrl,
    Gender? gender,
    DateTime? birthdate,
    String? city,
    String? interests,
    bool? verifiedFlag,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      username: username ?? this.username,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      bio: bio ?? this.bio,
      photoUrl: photoUrl ?? this.photoUrl,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      gender: gender ?? this.gender,
      birthdate: birthdate ?? this.birthdate,
      city: city ?? this.city,
      interests: interests ?? this.interests,
      verifiedFlag: verifiedFlag ?? this.verifiedFlag,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is User && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'User(id: $id, name: $name, username: $username)';
  }
}

