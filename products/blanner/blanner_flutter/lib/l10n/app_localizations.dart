import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fr'),
  ];

  /// The application title
  ///
  /// In en, this message translates to:
  /// **'Blanner'**
  String get appTitle;

  /// Button label to create a new BLAN
  ///
  /// In en, this message translates to:
  /// **'Create BLAN'**
  String get createBlan;

  /// Title for basic information step
  ///
  /// In en, this message translates to:
  /// **'Basic Information'**
  String get basicInformation;

  /// Category label
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// Mood label
  ///
  /// In en, this message translates to:
  /// **'Mood'**
  String get mood;

  /// Description field label
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get description;

  /// Description field label with optional indicator
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get descriptionOptional;

  /// Hint text for description field
  ///
  /// In en, this message translates to:
  /// **'Tell people what this BLAN is about...'**
  String get descriptionHint;

  /// Where section title
  ///
  /// In en, this message translates to:
  /// **'Where?'**
  String get where;

  /// Subtitle for where section
  ///
  /// In en, this message translates to:
  /// **'Choose where you want to meet (optional)'**
  String get whereSubtitle;

  /// Label for choosing exact place
  ///
  /// In en, this message translates to:
  /// **'Choose an exact place'**
  String get chooseExactPlace;

  /// Hint for place search
  ///
  /// In en, this message translates to:
  /// **'Search places near you (optional)'**
  String get searchPlacesNearYou;

  /// Label for choosing area
  ///
  /// In en, this message translates to:
  /// **'Choose an area'**
  String get chooseArea;

  /// To Be Determined option
  ///
  /// In en, this message translates to:
  /// **'TBD'**
  String get tbd;

  /// Description for TBD option
  ///
  /// In en, this message translates to:
  /// **'Location to be determined later'**
  String get tbdDescription;

  /// Subtitle for exact place option
  ///
  /// In en, this message translates to:
  /// **'Choose a specific venue (café, club…)'**
  String get exactPlaceSubtitle;

  /// Subtitle for area option
  ///
  /// In en, this message translates to:
  /// **'Pick a district such as Maarif or Gauthier'**
  String get areaSubtitle;

  /// Subtitle for flexible/TBD option
  ///
  /// In en, this message translates to:
  /// **'We will choose the location later'**
  String get flexibleSubtitle;

  /// Error message when location mode is not selected
  ///
  /// In en, this message translates to:
  /// **'Please choose where this BLAN will happen.'**
  String get pleaseChooseLocation;

  /// Hint for area selection
  ///
  /// In en, this message translates to:
  /// **'Select a neighborhood or place a pin'**
  String get selectNeighborhoodOrPin;

  /// When section title
  ///
  /// In en, this message translates to:
  /// **'When?'**
  String get when;

  /// Subtitle for when section
  ///
  /// In en, this message translates to:
  /// **'Choose date and time'**
  String get chooseDateAndTime;

  /// Date label
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// Time label
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get time;

  /// Text shown when date/time is not set
  ///
  /// In en, this message translates to:
  /// **'Not set'**
  String get notSet;

  /// Next button label
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// Back button label
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get back;

  /// Text shown while creating BLAN
  ///
  /// In en, this message translates to:
  /// **'Creating...'**
  String get creating;

  /// Success message after creating BLAN
  ///
  /// In en, this message translates to:
  /// **'BLAN created successfully!'**
  String get blanCreatedSuccessfully;

  /// Error message when required fields are missing
  ///
  /// In en, this message translates to:
  /// **'Please fill required fields.'**
  String get pleaseFillRequiredFields;

  /// Today option for date selection
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// Tomorrow option for date selection
  ///
  /// In en, this message translates to:
  /// **'Tomorrow'**
  String get tomorrow;

  /// Next weekend option for date selection
  ///
  /// In en, this message translates to:
  /// **'Next weekend'**
  String get nextWeekend;

  /// Label for custom date picker
  ///
  /// In en, this message translates to:
  /// **'Choose a date'**
  String get chooseDate;

  /// Morning option for time selection
  ///
  /// In en, this message translates to:
  /// **'Morning'**
  String get morning;

  /// Evening option for time selection
  ///
  /// In en, this message translates to:
  /// **'Evening'**
  String get evening;

  /// Night option for time selection
  ///
  /// In en, this message translates to:
  /// **'Night'**
  String get night;

  /// Label for custom time picker
  ///
  /// In en, this message translates to:
  /// **'Choose a time'**
  String get chooseTime;

  /// Message shown when place is selected, explaining area is disabled
  ///
  /// In en, this message translates to:
  /// **'You can only choose either a place or an area, not both.'**
  String get placeSelectedAreaDisabled;

  /// Message shown when area is selected, explaining place is disabled
  ///
  /// In en, this message translates to:
  /// **'You can only choose either a place or an area, not both.'**
  String get areaSelectedPlaceDisabled;

  /// Title for discard changes confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Discard changes?'**
  String get discardChanges;

  /// Message in discard changes confirmation dialog
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to discard your changes?'**
  String get discardChangesMessage;

  /// Cancel button label
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// Discard button label
  ///
  /// In en, this message translates to:
  /// **'Discard'**
  String get discard;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
