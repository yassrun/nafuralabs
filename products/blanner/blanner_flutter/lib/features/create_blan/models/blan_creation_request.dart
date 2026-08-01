import 'area.dart';
import 'category.dart';
import 'enums.dart';
import 'real_place.dart';

class BlanCreationRequest {
  final Category? category;
  final Mood? mood;
  final String? title;
  final String? customDescription;

  final DateTime? dateTime;
  final LocationMode? locationMode; // EXACT, AREA, or FLEXIBLE
  final RealPlace? place; // Selected place from Google Places (when locationMode is EXACT)
  final Area? area; // Selected area (neighborhood or map pin) (when locationMode is AREA)
  final String? coverImageUrl; // Cover image URL (from place photo or category default)

  final GroupSize? groupSize;
  final GenderPreference? genderPref;
  final bool approvalRequired;
  final int? maxParticipants;

  final BillPolicy? billPolicy;
  final VisibilityEnum? visibility;

  const BlanCreationRequest({
    this.category,
    this.mood,
    this.title,
    this.customDescription,
    this.dateTime,
    this.locationMode,
    this.place,
    this.area,
    this.coverImageUrl,
    this.groupSize,
    this.genderPref,
    this.approvalRequired = false,
    this.maxParticipants,
    this.billPolicy,
    this.visibility,
  });

  BlanCreationRequest copyWith({
    Category? category,
    Mood? mood,
    String? title,
    String? customDescription,
    DateTime? dateTime,
    LocationMode? locationMode,
    RealPlace? place,
    Area? area,
    String? coverImageUrl,
    GroupSize? groupSize,
    GenderPreference? genderPref,
    bool? approvalRequired,
    int? maxParticipants,
    BillPolicy? billPolicy,
    VisibilityEnum? visibility,
    bool clearPlace = false,
    bool clearArea = false,
  }) {
    return BlanCreationRequest(
      category: category ?? this.category,
      mood: mood ?? this.mood,
      title: title ?? this.title,
      customDescription: customDescription ?? this.customDescription,
      dateTime: dateTime ?? this.dateTime,
      locationMode: locationMode ?? this.locationMode,
      place: clearPlace ? null : (place ?? this.place),
      area: clearArea ? null : (area ?? this.area),
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      groupSize: groupSize ?? this.groupSize,
      genderPref: genderPref ?? this.genderPref,
      approvalRequired: approvalRequired ?? this.approvalRequired,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      billPolicy: billPolicy ?? this.billPolicy,
      visibility: visibility ?? this.visibility,
    );
  }
}

