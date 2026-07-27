// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Blanner';

  @override
  String get createBlan => 'Create BLAN';

  @override
  String get basicInformation => 'Basic Information';

  @override
  String get category => 'Category';

  @override
  String get mood => 'Mood';

  @override
  String get description => 'Description';

  @override
  String get descriptionOptional => 'Description (optional)';

  @override
  String get descriptionHint => 'Tell people what this BLAN is about...';

  @override
  String get where => 'Where?';

  @override
  String get whereSubtitle => 'Choose where you want to meet (optional)';

  @override
  String get chooseExactPlace => 'Choose an exact place';

  @override
  String get searchPlacesNearYou => 'Search places near you (optional)';

  @override
  String get chooseArea => 'Choose an area';

  @override
  String get tbd => 'TBD';

  @override
  String get tbdDescription => 'Location to be determined later';

  @override
  String get exactPlaceSubtitle => 'Choose a specific venue (café, club…)';

  @override
  String get areaSubtitle => 'Pick a district such as Maarif or Gauthier';

  @override
  String get flexibleSubtitle => 'We will choose the location later';

  @override
  String get pleaseChooseLocation =>
      'Please choose where this BLAN will happen.';

  @override
  String get selectNeighborhoodOrPin => 'Select a neighborhood or place a pin';

  @override
  String get when => 'When?';

  @override
  String get chooseDateAndTime => 'Choose date and time';

  @override
  String get date => 'Date';

  @override
  String get time => 'Time';

  @override
  String get notSet => 'Not set';

  @override
  String get next => 'Next';

  @override
  String get back => 'Back';

  @override
  String get creating => 'Creating...';

  @override
  String get blanCreatedSuccessfully => 'BLAN created successfully!';

  @override
  String get pleaseFillRequiredFields => 'Please fill required fields.';

  @override
  String get today => 'Today';

  @override
  String get tomorrow => 'Tomorrow';

  @override
  String get nextWeekend => 'Next weekend';

  @override
  String get chooseDate => 'Choose a date';

  @override
  String get morning => 'Morning';

  @override
  String get evening => 'Evening';

  @override
  String get night => 'Night';

  @override
  String get chooseTime => 'Choose a time';

  @override
  String get placeSelectedAreaDisabled =>
      'You can only choose either a place or an area, not both.';

  @override
  String get areaSelectedPlaceDisabled =>
      'You can only choose either a place or an area, not both.';

  @override
  String get discardChanges => 'Discard changes?';

  @override
  String get discardChangesMessage =>
      'Are you sure you want to discard your changes?';

  @override
  String get cancel => 'Cancel';

  @override
  String get discard => 'Discard';
}
