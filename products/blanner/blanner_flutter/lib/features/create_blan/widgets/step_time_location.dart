import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../providers/create_blan_provider.dart';

class StepTimeLocation extends ConsumerStatefulWidget {
  const StepTimeLocation({super.key});

  @override
  ConsumerState<StepTimeLocation> createState() => _StepTimeLocationState();
}

class _StepTimeLocationState extends ConsumerState<StepTimeLocation> {

  Future<void> _selectDate(BuildContext context) async {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final initialDate = data.dateTime ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      final time = data.dateTime != null
          ? TimeOfDay.fromDateTime(data.dateTime!)
          : TimeOfDay.now();
      final newDateTime = DateTime(
        picked.year,
        picked.month,
        picked.day,
        time.hour,
        time.minute,
      );
      ref.read(createBlanProvider.notifier).updateData(
            data.copyWith(dateTime: newDateTime),
          );
    }
  }

  Future<void> _selectTime(BuildContext context) async {
    final state = ref.read(createBlanProvider);
    final data = state.data;
    final initialTime = data.dateTime != null
        ? TimeOfDay.fromDateTime(data.dateTime!)
        : TimeOfDay.now();
    final picked = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );
    if (picked != null) {
      final date = data.dateTime ?? DateTime.now();
      final newDateTime = DateTime(
        date.year,
        date.month,
        date.day,
        picked.hour,
        picked.minute,
      );
      ref.read(createBlanProvider.notifier).updateData(
            data.copyWith(dateTime: newDateTime),
          );
    }
  }

  String _formatDateTime(DateTime? dateTime) {
    if (dateTime == null) return 'Not set';
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year} at $displayHour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;

    return ListView(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        Text(
          'Date & Time',
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Date
        Text(
          'Date *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        InkWell(
          onTap: () => _selectDate(context),
          child: Container(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            decoration: BoxDecoration(
              color: BlannerColors.surface,
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
              border: Border.all(
                color: BlannerColors.textSecondary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  color: BlannerColors.textSecondary,
                ),
                const SizedBox(width: BlannerSpacing.sm),
                Text(
                  _formatDateTime(data.dateTime),
                  style: BlannerTextStyles.body1,
                ),
                const Spacer(),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: BlannerColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: BlannerSpacing.md),
        // Time
        Text(
          'Time *',
          style: BlannerTextStyles.subtitle1,
        ),
        const SizedBox(height: BlannerSpacing.sm),
        InkWell(
          onTap: () => _selectTime(context),
          child: Container(
            padding: const EdgeInsets.all(BlannerSpacing.md),
            decoration: BoxDecoration(
              color: BlannerColors.surface,
              borderRadius: BorderRadius.circular(BlannerRadius.medium),
              border: Border.all(
                color: BlannerColors.textSecondary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.access_time,
                  color: BlannerColors.textSecondary,
                ),
                const SizedBox(width: BlannerSpacing.sm),
                Text(
                  data.dateTime != null
                      ? TimeOfDay.fromDateTime(data.dateTime!).format(context)
                      : 'Not set',
                  style: BlannerTextStyles.body1,
                ),
                const Spacer(),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: BlannerColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

