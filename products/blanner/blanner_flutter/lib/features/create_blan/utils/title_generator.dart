import '../models/blan_creation_request.dart';

/// Generates an automatic title for a BLAN based on its information
class TitleGenerator {
  static String generateTitle(BlanCreationRequest data) {
    final parts = <String>[];

    // Add category
    if (data.category != null) {
      parts.add(data.category!.toLabel());
    }

    // Add location
    if (data.place != null) {
      parts.add('at ${data.place!.name}');
    } else if (data.area != null) {
      parts.add('in ${data.area!.name}');
    }

    // Add time
    if (data.dateTime != null) {
      final dateTime = data.dateTime!;
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
      
      parts.add('on ${months[dateTime.month - 1]} ${dateTime.day} at $displayHour:$minute $period');
    }

    // If we have parts, join them; otherwise return a default
    if (parts.isNotEmpty) {
      return parts.join(' ');
    }

    return 'New BLAN';
  }
}

