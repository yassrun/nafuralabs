enum BillPolicy {
  invite,
  beInvited,
  split,
  decideLater;

  String toLabel() {
    switch (this) {
      case BillPolicy.invite:
        return 'I invite';
      case BillPolicy.beInvited:
        return 'Be invited';
      case BillPolicy.split:
        return 'Split';
      case BillPolicy.decideLater:
        return 'Decide later';
    }
  }

  String toEmoji() {
    switch (this) {
      case BillPolicy.invite:
        return '🎁';
      case BillPolicy.beInvited:
        return '🙏';
      case BillPolicy.split:
        return '⚖️';
      case BillPolicy.decideLater:
        return '🤔';
    }
  }

  String toJson() {
    switch (this) {
      case BillPolicy.invite:
        return 'HOST_INVITES';
      case BillPolicy.beInvited:
        return 'EACH_PAYS'; // Map beInvited to EACH_PAYS as closest match
      case BillPolicy.split:
        return 'SPLIT_EQUAL';
      case BillPolicy.decideLater:
        return 'TO_BE_DECIDED';
    }
  }

  static BillPolicy? fromString(String? value) {
    if (value == null) return null;
    switch (value) {
      case 'invite':
        return BillPolicy.invite;
      case 'be_invited':
        return BillPolicy.beInvited;
      case 'split':
        return BillPolicy.split;
      case 'decide_later':
        return BillPolicy.decideLater;
      default:
        return null;
    }
  }
}

enum CategoryEnum {
  home,
  coffee,
  food,
  nature,
  sport,
  culture,
  study,
  party,
  games,
  volunteer,
  other;

  String toLabel() {
    switch (this) {
      case CategoryEnum.home:
        return 'Home';
      case CategoryEnum.coffee:
        return 'Coffee';
      case CategoryEnum.food:
        return 'Food';
      case CategoryEnum.nature:
        return 'Nature';
      case CategoryEnum.sport:
        return 'Sport';
      case CategoryEnum.culture:
        return 'Culture';
      case CategoryEnum.study:
        return 'Study';
      case CategoryEnum.party:
        return 'Party';
      case CategoryEnum.games:
        return 'Games';
      case CategoryEnum.volunteer:
        return 'Volunteer';
      case CategoryEnum.other:
        return 'Other';
    }
  }

  String toEmoji() {
    switch (this) {
      case CategoryEnum.home:
        return '🏠';
      case CategoryEnum.coffee:
        return '☕';
      case CategoryEnum.food:
        return '🍽️';
      case CategoryEnum.nature:
        return '🌳';
      case CategoryEnum.sport:
        return '⚽';
      case CategoryEnum.culture:
        return '🎭';
      case CategoryEnum.study:
        return '📚';
      case CategoryEnum.party:
        return '🎉';
      case CategoryEnum.games:
        return '🎮';
      case CategoryEnum.volunteer:
        return '🤝';
      case CategoryEnum.other:
        return '📌';
    }
  }

  /// Returns default image URL or local asset path for the category
  String getDefaultImageUrl() {
    switch (this) {
      case CategoryEnum.coffee:
        return 'assets/images/categories/Coffee.png';
      case CategoryEnum.food:
        return 'assets/images/categories/Food  Restaurants.png';
      case CategoryEnum.nature:
        return 'assets/images/categories/Outdoor  Nature.png';
      case CategoryEnum.sport:
        return 'assets/images/categories/Gym  Fitness.png';
      case CategoryEnum.culture:
        return 'assets/images/categories/Cinema.png';
      case CategoryEnum.study:
        return 'assets/images/categories/Study  Work.png';
      case CategoryEnum.party:
        return 'assets/images/categories/Drinks  Rooftop  Lounge.png';
      case CategoryEnum.games:
        return 'assets/images/categories/Games.png';
      case CategoryEnum.home:
      case CategoryEnum.volunteer:
      case CategoryEnum.other:
        // No specific image for these categories yet
        return '';
    }
  }

  /// Returns Google Places type filters for autocomplete
  List<String> getGooglePlacesTypes() {
    switch (this) {
      case CategoryEnum.coffee:
        return ['cafe', 'coffee_shop'];
      case CategoryEnum.food:
        return ['restaurant', 'food'];
      case CategoryEnum.party:
      case CategoryEnum.games:
        return ['bar', 'night_club', 'lounge'];
      case CategoryEnum.sport:
        return ['gym', 'stadium', 'park'];
      case CategoryEnum.nature:
        return ['park', 'natural_feature'];
      case CategoryEnum.study:
        return ['library', 'university', 'cafe'];
      case CategoryEnum.culture:
        return ['museum', 'art_gallery', 'theater'];
      case CategoryEnum.home:
      case CategoryEnum.volunteer:
      case CategoryEnum.other:
        return []; // No specific filter
    }
  }
}

enum GenderPreference {
  any,
  maleOnly,
  femaleOnly;

  String toLabel() {
    switch (this) {
      case GenderPreference.any:
        return 'Any';
      case GenderPreference.maleOnly:
        return 'Male only';
      case GenderPreference.femaleOnly:
        return 'Female only';
    }
  }

  String toJson() {
    switch (this) {
      case GenderPreference.any:
        return 'ANY';
      case GenderPreference.maleOnly:
        return 'MALE_ONLY';
      case GenderPreference.femaleOnly:
        return 'FEMALE_ONLY';
    }
  }
}

enum GroupSize {
  plusOne,
  small,
  open;

  String toLabel() {
    switch (this) {
      case GroupSize.plusOne:
        return 'One to One';
      case GroupSize.small:
        return 'Small';
      case GroupSize.open:
        return 'Open';
    }
  }

  String toDescription() {
    switch (this) {
      case GroupSize.plusOne:
        return 'Just me and you (2 people)';
      case GroupSize.small:
        return '3–6 people';
      case GroupSize.open:
        return 'No limit';
    }
  }

  String toJson() {
    switch (this) {
      case GroupSize.plusOne:
        return 'PLUS_ONE';
      case GroupSize.small:
        return 'SMALL';
      case GroupSize.open:
        return 'OPEN';
    }
  }
}

enum LocationMode {
  exact,    // Exact place
  area,     // Area/neighborhood
  flexible; // TBD - location to be determined

  String toLabel() {
    switch (this) {
      case LocationMode.exact:
        return 'Exact place';
      case LocationMode.area:
        return 'Area';
      case LocationMode.flexible:
        return 'TBD';
    }
  }

  String toJson() {
    switch (this) {
      case LocationMode.exact:
        return 'EXACT_PLACE';
      case LocationMode.area:
        return 'AREA';
      case LocationMode.flexible:
        return 'FLEXIBLE';
    }
  }

  static LocationMode? fromString(String? value) {
    if (value == null) return null;
    switch (value.toUpperCase()) {
      case 'EXACT':
      case 'EXACT_PLACE':
        return LocationMode.exact;
      case 'AREA':
        return LocationMode.area;
      case 'FLEXIBLE':
        return LocationMode.flexible;
      default:
        return null;
    }
  }
}

enum Mood {
  chill,
  friendly,
  energetic,
  calm,
  fun,
  focused;

  String toLabel() {
    switch (this) {
      case Mood.chill:
        return 'Chill';
      case Mood.friendly:
        return 'Friendly';
      case Mood.energetic:
        return 'Energetic';
      case Mood.calm:
        return 'Calm';
      case Mood.fun:
        return 'Fun';
      case Mood.focused:
        return 'Focused';
    }
  }

  String toEmoji() {
    switch (this) {
      case Mood.chill:
        return '😌';
      case Mood.friendly:
        return '😊';
      case Mood.energetic:
        return '⚡';
      case Mood.calm:
        return '🧘';
      case Mood.fun:
        return '🎈';
      case Mood.focused:
        return '🎯';
    }
  }

  String toJson() {
    switch (this) {
      case Mood.chill:
        return 'CHILL';
      case Mood.friendly:
        return 'FRIENDLY';
      case Mood.energetic:
        return 'ENERGETIC';
      case Mood.calm:
        return 'CALM';
      case Mood.fun:
        return 'FUN';
      case Mood.focused:
        return 'FOCUSED';
    }
  }
}

enum PlaceTypeEnum {
  cafe,
  restaurant,
  bar,
  gym,
  park,
  beach,
  rooftop,
  library,
  other;

  String toLabel() {
    switch (this) {
      case PlaceTypeEnum.cafe:
        return 'Cafe';
      case PlaceTypeEnum.restaurant:
        return 'Restaurant';
      case PlaceTypeEnum.bar:
        return 'Bar';
      case PlaceTypeEnum.gym:
        return 'Gym';
      case PlaceTypeEnum.park:
        return 'Park';
      case PlaceTypeEnum.beach:
        return 'Beach';
      case PlaceTypeEnum.rooftop:
        return 'Rooftop';
      case PlaceTypeEnum.library:
        return 'Library';
      case PlaceTypeEnum.other:
        return 'Other';
    }
  }

  String toEmoji() {
    switch (this) {
      case PlaceTypeEnum.cafe:
        return '☕';
      case PlaceTypeEnum.restaurant:
        return '🍽️';
      case PlaceTypeEnum.bar:
        return '🍻';
      case PlaceTypeEnum.gym:
        return '💪';
      case PlaceTypeEnum.park:
        return '🌳';
      case PlaceTypeEnum.beach:
        return '🏖️';
      case PlaceTypeEnum.rooftop:
        return '🏙️';
      case PlaceTypeEnum.library:
        return '📚';
      case PlaceTypeEnum.other:
        return '📍';
    }
  }
}

enum VisibilityEnum {
  public,
  friends,
  private;

  String toLabel() {
    switch (this) {
      case VisibilityEnum.public:
        return 'Public';
      case VisibilityEnum.friends:
        return 'Friends';
      case VisibilityEnum.private:
        return 'Private';
    }
  }

  String toDescription() {
    switch (this) {
      case VisibilityEnum.public:
        return 'Anyone can see and join';
      case VisibilityEnum.friends:
        return 'Only your friends can see';
      case VisibilityEnum.private:
        return 'Only invited people can see';
    }
  }

  String toEmoji() {
    switch (this) {
      case VisibilityEnum.public:
        return '🌐';
      case VisibilityEnum.friends:
        return '👥';
      case VisibilityEnum.private:
        return '🔒';
    }
  }

  String toJson() {
    switch (this) {
      case VisibilityEnum.public:
        return 'PUBLIC';
      case VisibilityEnum.friends:
        return 'FRIENDS';
      case VisibilityEnum.private:
        return 'PRIVATE';
    }
  }
}

