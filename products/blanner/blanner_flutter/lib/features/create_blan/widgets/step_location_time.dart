import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../l10n/app_localizations.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/area.dart';
import '../models/enums.dart';
import '../models/real_place.dart';
import '../providers/create_blan_provider.dart';
import 'area_picker_bottom_sheet.dart';
import 'place_picker_bottom_sheet.dart';

class StepLocationTime extends ConsumerStatefulWidget {
  const StepLocationTime({super.key});

  @override
  ConsumerState<StepLocationTime> createState() => _StepLocationTimeState();
}

class _StepLocationTimeState extends ConsumerState<StepLocationTime> {
  String? _validationError;
  final ScrollController _scrollController = ScrollController();
  String? _selectedTimeSlot; // 'morning', 'afternoon', 'evening', 'night', or 'custom'

  @override
  void initState() {
    super.initState();
    // Apply smart defaults on first load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _applySmartDefaults();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  /// Apply smart defaults based on current time
  void _applySmartDefaults() {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    
    // Only apply defaults if no dateTime is set
    if (data.dateTime == null) {
      final now = DateTime.now();
      final currentHour = now.hour;
      
      DateTime selectedDate;
      if (currentHour < 18) {
        // Before 6 PM: Today Evening at 19:00
        selectedDate = DateTime(now.year, now.month, now.day);
        setState(() {
          _selectedTimeSlot = 'evening';
        });
      } else {
        // After 6 PM: Tomorrow Evening at 19:00
        selectedDate = DateTime(now.year, now.month, now.day + 1);
        setState(() {
          _selectedTimeSlot = 'evening';
        });
      }
      
      final newDateTime = DateTime(
        selectedDate.year,
        selectedDate.month,
        selectedDate.day,
        19, // 7 PM (evening)
        0,
      );
      
      ref.read(createBlanProvider.notifier).updateData(
        data.copyWith(dateTime: newDateTime),
      );
      
      // Auto-scroll to time section after defaults are applied
      Future.delayed(const Duration(milliseconds: 500), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            450, // Approximate position of time section
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  void _selectDay(BuildContext context, String option) {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final now = DateTime.now();
    final currentTime = data.dateTime != null
        ? TimeOfDay.fromDateTime(data.dateTime!)
        : const TimeOfDay(hour: 19, minute: 0); // Default to evening

    DateTime selectedDate;
    switch (option) {
      case 'today':
        selectedDate = DateTime(now.year, now.month, now.day);
        break;
      case 'tomorrow':
        selectedDate = DateTime(now.year, now.month, now.day + 1);
        break;
      case 'thisWeekend':
        // Find next Saturday
        final daysUntilSaturday = (DateTime.saturday - now.weekday) % 7;
        final nextSaturday = daysUntilSaturday == 0
            ? now.add(const Duration(days: 7)) // If today is Saturday, get next week
            : now.add(Duration(days: daysUntilSaturday));
        selectedDate = DateTime(nextSaturday.year, nextSaturday.month, nextSaturday.day);
        break;
      case 'nextWeek':
        // Find next Monday
        final daysUntilMonday = (DateTime.monday - now.weekday) % 7;
        final nextMonday = daysUntilMonday == 0
            ? now.add(const Duration(days: 7)) // If today is Monday, get next week
            : now.add(Duration(days: daysUntilMonday));
        selectedDate = DateTime(nextMonday.year, nextMonday.month, nextMonday.day);
        break;
      default:
        return;
    }

    final newDateTime = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      currentTime.hour,
      currentTime.minute,
    );
    ref.read(createBlanProvider.notifier).updateData(
          data.copyWith(dateTime: newDateTime),
        );
    
    // Trigger rebuild to show time section with animation
    setState(() {});
    
    // Auto-scroll to time section after a short delay
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          450, // Approximate position of time section
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _selectTimeSlot(BuildContext context, String option) {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final date = data.dateTime ?? DateTime.now();

    int hour;
    int minute = 0;
    switch (option) {
      case 'morning':
        hour = 10;
        minute = 0;
        break;
      case 'afternoon':
        hour = 15;
        minute = 0;
        break;
      case 'evening':
        hour = 19;
        minute = 0;
        break;
      case 'night':
        hour = 21;
        minute = 30;
        break;
      default:
        return;
    }

    setState(() {
      _selectedTimeSlot = option;
    });

    final newDateTime = DateTime(
      date.year,
      date.month,
      date.day,
      hour,
      minute,
    );
    ref.read(createBlanProvider.notifier).updateData(
          data.copyWith(dateTime: newDateTime),
        );
  }

  /// Pick a custom date - opens date picker
  Future<void> _pickCustomDate(BuildContext context) async {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final initialDateTime = data.dateTime ?? DateTime.now();
    
    // Show date picker
    final selectedDate = await showDatePicker(
      context: context,
      initialDate: initialDateTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (selectedDate == null) return; // User cancelled

    // Keep the current time or use default evening time
    final currentTime = data.dateTime != null
        ? TimeOfDay.fromDateTime(data.dateTime!)
        : const TimeOfDay(hour: 19, minute: 0);

    // Combine date and time
    final newDateTime = DateTime(
      selectedDate.year,
      selectedDate.month,
      selectedDate.day,
      currentTime.hour,
      currentTime.minute,
    );

    ref.read(createBlanProvider.notifier).updateData(
          data.copyWith(dateTime: newDateTime),
        );
    
    // Mark as custom time slot if time doesn't match any slot
    setState(() {
      _selectedTimeSlot = 'custom';
    });
  }

  /// Open time picker to edit exact time
  Future<void> _pickExactTime(BuildContext context) async {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    
    if (data.dateTime == null) {
      // If no date selected, select today first
      final now = DateTime.now();
      final newDateTime = DateTime(now.year, now.month, now.day, 19, 0);
      ref.read(createBlanProvider.notifier).updateData(
        data.copyWith(dateTime: newDateTime),
      );
    }
    
    final currentState = ref.read(createBlanProvider);
    final currentData = currentState.data;
    final initialDateTime = currentData.dateTime ?? DateTime.now();
    
    // Show time picker
    final selectedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initialDateTime),
    );

    if (selectedTime == null) return; // User cancelled

    final date = currentData.dateTime ?? DateTime.now();
    
    // Combine date and time
    final newDateTime = DateTime(
      date.year,
      date.month,
      date.day,
      selectedTime.hour,
      selectedTime.minute,
    );

    // Check if the selected time matches any time slot
    String? matchedSlot;
    if (selectedTime.hour == 10 && selectedTime.minute == 0) {
      matchedSlot = 'morning';
    } else if (selectedTime.hour == 15 && selectedTime.minute == 0) {
      matchedSlot = 'afternoon';
    } else if (selectedTime.hour == 19 && selectedTime.minute == 0) {
      matchedSlot = 'evening';
    } else if (selectedTime.hour == 21 && selectedTime.minute == 30) {
      matchedSlot = 'night';
    } else {
      matchedSlot = 'custom';
    }

    setState(() {
      _selectedTimeSlot = matchedSlot;
    });

    ref.read(createBlanProvider.notifier).updateData(
          currentData.copyWith(dateTime: newDateTime),
        );
  }

  String _formatTimeForDisplay(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute;
    return '${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')}';
  }


  void _selectLocationMode(LocationMode mode) {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final notifier = ref.read(createBlanProvider.notifier);
    final category = data.category;

    // Clear validation error
    setState(() {
      _validationError = null;
    });

    switch (mode) {
      case LocationMode.exact:
        // Set locationMode and open place picker
        notifier.updateData(
          data.copyWith(
            locationMode: LocationMode.exact,
            area: null,
            clearArea: true,
          ),
        );
        _openPlacePicker(context, ref, data, notifier, category);
        break;

      case LocationMode.area:
        // Set locationMode and open area picker
        notifier.updateData(
          data.copyWith(
            locationMode: LocationMode.area,
            place: null,
            clearPlace: true,
          ),
        );
        _openAreaPicker(context, ref, data, notifier);
        break;

      case LocationMode.flexible:
        // Just set locationMode to FLEXIBLE, clear place and area
        notifier.updateData(
          data.copyWith(
            locationMode: LocationMode.flexible,
            place: null,
            area: null,
            clearPlace: true,
            clearArea: true,
            coverImageUrl: category?.getDefaultImageUrl() ?? '',
          ),
        );
        break;
    }
  }

  Future<void> _openPlacePicker(
    BuildContext context,
    WidgetRef ref,
    data,
    notifier,
    category,
  ) async {
    if (category == null) {
      return;
    }
    
    final selectedPlace = await showModalBottomSheet<RealPlace>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => PlacePickerBottomSheet(
        category: category,
      ),
    );

    if (selectedPlace != null) {
      final newData = data.copyWith(
        place: selectedPlace,
        locationMode: LocationMode.exact,
        area: null,
        clearArea: true,
        coverImageUrl: selectedPlace.photoUrls.isNotEmpty
            ? selectedPlace.photoUrls.first
            : category?.getDefaultImageUrl() ?? '',
      );
      notifier.updateData(newData);
    } else {
      // User cancelled - if no place was selected before, clear locationMode
      if (data.place == null) {
        notifier.updateData(
          data.copyWith(
            locationMode: null,
          ),
        );
      }
    }
  }

  Future<void> _openAreaPicker(
    BuildContext context,
    WidgetRef ref,
    data,
    notifier,
  ) async {
    final category = data.category;
    final selectedArea = await showModalBottomSheet<Area>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AreaPickerBottomSheet(
        category: category,
      ),
    );

    if (selectedArea != null) {
      final category = data.category;
      final newData = data.copyWith(
        area: selectedArea,
        locationMode: LocationMode.area,
        place: null,
        clearPlace: true,
        coverImageUrl: category?.getDefaultImageUrl() ?? '',
      );
      notifier.updateData(newData);
    } else {
      // User cancelled - if no area was selected before, clear locationMode
      if (data.area == null) {
        notifier.updateData(
          data.copyWith(
            locationMode: null,
          ),
        );
      }
    }
  }

  Widget _buildLocationModeCard(
    BuildContext context,
    LocationMode mode,
    bool isSelected,
    IconData icon,
    String title,
    String subtitle,
  ) {
    return InkWell(
      onTap: () => _selectLocationMode(mode),
      child: Container(
        padding: const EdgeInsets.all(BlannerSpacing.md),
        decoration: BoxDecoration(
          color: BlannerColors.surface,
          borderRadius: BorderRadius.circular(BlannerRadius.medium),
          border: Border.all(
            color: isSelected
                ? BlannerColors.primary
                : BlannerColors.textSecondary.withValues(alpha: 0.2),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Leading icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isSelected
                    ? BlannerColors.primary.withValues(alpha: 0.1)
                    : BlannerColors.textSecondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(BlannerRadius.small),
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? BlannerColors.primary
                    : BlannerColors.textSecondary,
                size: 24,
              ),
            ),
            const SizedBox(width: BlannerSpacing.md),
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: BlannerTextStyles.body1.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? BlannerColors.primary
                          : BlannerColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: BlannerSpacing.xs),
                  Text(
                    subtitle,
                    style: BlannerTextStyles.caption.copyWith(
                      color: BlannerColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            // Checkmark if selected
            if (isSelected)
              Icon(
                Icons.check_circle,
                color: BlannerColors.primary,
                size: 24,
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;
    final l10n = AppLocalizations.of(context)!;

    final selectedMode = data.locationMode;
    final isExactSelected = selectedMode == LocationMode.exact;
    final isAreaSelected = selectedMode == LocationMode.area;
    final isFlexibleSelected = selectedMode == LocationMode.flexible;

    return ListView(
      controller: _scrollController,
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        // Where Section
        Text(
          l10n.where,
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.md),
        Text(
          l10n.whereSubtitle,
          style: BlannerTextStyles.body2.copyWith(
            color: BlannerColors.textSecondary,
          ),
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Card A: Exact place
        _buildLocationModeCard(
          context,
          LocationMode.exact,
          isExactSelected,
          Icons.location_on_outlined,
          l10n.chooseExactPlace,
          l10n.exactPlaceSubtitle,
        ),
        const SizedBox(height: BlannerSpacing.md),
        // Card B: Area / neighborhood
        _buildLocationModeCard(
          context,
          LocationMode.area,
          isAreaSelected,
          Icons.map_outlined,
          l10n.chooseArea,
          l10n.areaSubtitle,
        ),
        const SizedBox(height: BlannerSpacing.md),
        // Card C: TBD / Flexible
        _buildLocationModeCard(
          context,
          LocationMode.flexible,
          isFlexibleSelected,
          Icons.help_outline,
          l10n.tbd,
          l10n.flexibleSubtitle,
        ),
        // Show selected place/area if applicable
        if (isExactSelected && data.place != null) ...[
          const SizedBox(height: BlannerSpacing.lg),
          Container(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            decoration: BoxDecoration(
              color: BlannerColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
              border: Border.all(
                color: BlannerColors.primary,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.place, color: BlannerColors.primary),
                const SizedBox(width: BlannerSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.place!.name,
                        style: BlannerTextStyles.body1.copyWith(
                          fontWeight: FontWeight.w600,
                          color: BlannerColors.primary,
                        ),
                      ),
                      if (data.place!.address.isNotEmpty) ...[
                        const SizedBox(height: BlannerSpacing.xs),
                        Text(
                          data.place!.address,
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.textSecondary,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    final category = data.category;
                    ref.read(createBlanProvider.notifier).updateData(
                          data.copyWith(
                            locationMode: null,
                            clearPlace: true,
                            coverImageUrl: category?.getDefaultImageUrl() ?? '',
                          ),
                        );
                  },
                ),
              ],
            ),
          ),
        ],
        if (isAreaSelected && data.area != null) ...[
          const SizedBox(height: BlannerSpacing.lg),
          Container(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            decoration: BoxDecoration(
              color: BlannerColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
              border: Border.all(
                color: BlannerColors.primary,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(Icons.location_city, color: BlannerColors.primary),
                const SizedBox(width: BlannerSpacing.sm),
                Expanded(
                  child: Text(
                    data.area!.name,
                    style: BlannerTextStyles.body1.copyWith(
                      fontWeight: FontWeight.w600,
                      color: BlannerColors.primary,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () {
                    final category = data.category;
                    ref.read(createBlanProvider.notifier).updateData(
                          data.copyWith(
                            locationMode: null,
                            clearArea: true,
                            coverImageUrl: category?.getDefaultImageUrl() ?? '',
                          ),
                        );
                  },
                ),
              ],
            ),
          ),
        ],
        // Validation error
        if (_validationError != null) ...[
          const SizedBox(height: BlannerSpacing.md),
          Text(
            _validationError!,
            style: BlannerTextStyles.body2.copyWith(
              color: BlannerColors.error,
            ),
          ),
        ],
        const SizedBox(height: BlannerSpacing.xl),
        // When Section
        Text(
          l10n.when,
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // 📅 DAY SELECTION - Horizontal Scrollable Row
        SizedBox(
          height: 40, // Compact chip height
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              const SizedBox(width: BlannerSpacing.sm),
              _buildDayChip(context, 'Today', 'today', data),
              const SizedBox(width: BlannerSpacing.sm),
              _buildDayChip(context, 'Tomorrow', 'tomorrow', data),
              const SizedBox(width: BlannerSpacing.sm),
              _buildDayChip(context, 'This Weekend', 'thisWeekend', data),
              const SizedBox(width: BlannerSpacing.sm),
              _buildDayChip(context, 'Next Week', 'nextWeek', data),
              const SizedBox(width: BlannerSpacing.sm),
              _buildDayChip(context, 'Pick a date…', 'pickDate', data),
              const SizedBox(width: BlannerSpacing.sm),
            ],
          ),
        ),
        const SizedBox(height: BlannerSpacing.xl),
        // 🕒 TIME SLOT SELECTION - Shown only after day is selected (with animation)
        if (data.dateTime != null)
          AnimatedOpacity(
            opacity: 1.0,
            duration: const Duration(milliseconds: 300),
            child: AnimatedSlide(
              offset: Offset(0, data.dateTime != null ? 0 : 0.1),
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: BlannerSpacing.sm,
                    runSpacing: BlannerSpacing.sm,
                    children: [
                      _buildTimeSlotChip(context, 'Morning', 'morning', data),
                      _buildTimeSlotChip(context, 'Afternoon', 'afternoon', data),
                      _buildTimeSlotChip(context, 'Evening', 'evening', data),
                      _buildTimeSlotChip(context, 'Night', 'night', data),
                    ],
                  ),
                  const SizedBox(height: BlannerSpacing.md),
                  // ⏰ EXACT TIME - Minimal line
                  InkWell(
                    onTap: () => _pickExactTime(context),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: BlannerSpacing.sm),
                      child: Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            color: BlannerColors.primary,
                            size: 20,
                          ),
                          const SizedBox(width: BlannerSpacing.sm),
                          Text(
                            _formatTimeForDisplay(data.dateTime!),
                            style: BlannerTextStyles.body1.copyWith(
                              fontWeight: FontWeight.w600,
                              color: BlannerColors.textPrimary,
                            ),
                          ),
                          const Spacer(),
                          Icon(
                            Icons.edit_outlined,
                            size: 18,
                            color: BlannerColors.textSecondary,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDayChip(
    BuildContext context,
    String label,
    String option,
    data,
  ) {
    final now = DateTime.now();
    bool isSelected = false;

    if (data.dateTime != null) {
      final selectedDate = DateTime(
        data.dateTime!.year,
        data.dateTime!.month,
        data.dateTime!.day,
      );
      final today = DateTime(now.year, now.month, now.day);
      final tomorrow = today.add(const Duration(days: 1));

      switch (option) {
        case 'today':
          isSelected = selectedDate == today;
          break;
        case 'tomorrow':
          isSelected = selectedDate == tomorrow;
          break;
        case 'thisWeekend':
          final daysUntilSaturday = (DateTime.saturday - now.weekday) % 7;
          final nextSaturday = daysUntilSaturday == 0
              ? now.add(const Duration(days: 7))
              : now.add(Duration(days: daysUntilSaturday));
          final nextSaturdayDate = DateTime(
            nextSaturday.year,
            nextSaturday.month,
            nextSaturday.day,
          );
          isSelected = selectedDate == nextSaturdayDate;
          break;
        case 'nextWeek':
          final daysUntilMonday = (DateTime.monday - now.weekday) % 7;
          final nextMonday = daysUntilMonday == 0
              ? now.add(const Duration(days: 7))
              : now.add(Duration(days: daysUntilMonday));
          final nextMondayDate = DateTime(
            nextMonday.year,
            nextMonday.month,
            nextMonday.day,
          );
          isSelected = selectedDate == nextMondayDate;
          break;
        case 'pickDate':
          // "Pick a date" is selected if date doesn't match any quick option
          final isToday = selectedDate == today;
          final isTomorrow = selectedDate == tomorrow;
          final daysUntilSaturday = (DateTime.saturday - now.weekday) % 7;
          final nextSaturday = daysUntilSaturday == 0
              ? now.add(const Duration(days: 7))
              : now.add(Duration(days: daysUntilSaturday));
          final nextSaturdayDate = DateTime(
            nextSaturday.year,
            nextSaturday.month,
            nextSaturday.day,
          );
          final isThisWeekend = selectedDate == nextSaturdayDate;
          final daysUntilMonday = (DateTime.monday - now.weekday) % 7;
          final nextMonday = daysUntilMonday == 0
              ? now.add(const Duration(days: 7))
              : now.add(Duration(days: daysUntilMonday));
          final nextMondayDate = DateTime(
            nextMonday.year,
            nextMonday.month,
            nextMonday.day,
          );
          final isNextWeek = selectedDate == nextMondayDate;
          isSelected = !isToday && !isTomorrow && !isThisWeekend && !isNextWeek;
          break;
      }
    }

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        if (option == 'pickDate') {
          _pickCustomDate(context);
        } else {
          _selectDay(context, option);
        }
      },
      selectedColor: BlannerColors.primary.withValues(alpha: 0.2),
      backgroundColor: BlannerColors.surface,
      labelStyle: TextStyle(
        color: isSelected ? BlannerColors.primary : BlannerColors.textPrimary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        fontSize: 14, // Compact size
      ),
      side: BorderSide(
        color: isSelected
            ? BlannerColors.primary
            : BlannerColors.textSecondary.withValues(alpha: 0.2),
        width: isSelected ? 2 : 1,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      visualDensity: VisualDensity.compact,
    );
  }

  Widget _buildTimeSlotChip(
    BuildContext context,
    String label,
    String option,
    data,
  ) {
    bool isSelected = _selectedTimeSlot == option;

    if (data.dateTime != null && _selectedTimeSlot == null) {
      // Auto-detect time slot from current time
      final hour = data.dateTime!.hour;
      final minute = data.dateTime!.minute;
      if (hour == 10 && minute == 0) {
        isSelected = option == 'morning';
      } else if (hour == 15 && minute == 0) {
        isSelected = option == 'afternoon';
      } else if (hour == 19 && minute == 0) {
        isSelected = option == 'evening';
      } else if (hour == 21 && minute == 30) {
        isSelected = option == 'night';
      }
    }

    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) {
        _selectTimeSlot(context, option);
      },
      selectedColor: BlannerColors.primary.withValues(alpha: 0.2),
      backgroundColor: BlannerColors.surface,
      labelStyle: TextStyle(
        color: isSelected ? BlannerColors.primary : BlannerColors.textPrimary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
        fontSize: 14, // Compact size
      ),
      side: BorderSide(
        color: isSelected
            ? BlannerColors.primary
            : BlannerColors.textSecondary.withValues(alpha: 0.2),
        width: isSelected ? 2 : 1,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      visualDensity: VisualDensity.compact,
    );
  }

  /// Validate location selection before proceeding
  bool validateLocation() {
    final state = ref.read(createBlanProvider);
    final data = state.data;

    if (data.locationMode == null) {
      setState(() {
        _validationError = AppLocalizations.of(context)!.pleaseChooseLocation;
      });
      return false;
    }

    // Additional validation based on mode
    if (data.locationMode == LocationMode.exact && data.place == null) {
      setState(() {
        _validationError = AppLocalizations.of(context)!.pleaseChooseLocation;
      });
      return false;
    }

    if (data.locationMode == LocationMode.area && data.area == null) {
      setState(() {
        _validationError = AppLocalizations.of(context)!.pleaseChooseLocation;
      });
      return false;
    }

    setState(() {
      _validationError = null;
    });
    return true;
  }
}
