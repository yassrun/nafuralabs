import '../../create_blan/models/enums.dart';
import '../../home_feed/data/participation_status.dart';

/// BLAN status for My BLANs feature
enum BlanStatus {
  upcoming,
  past,
  canceled,
}

/// BLAN model for My BLANs feature
/// Used in both Created and My Activity tabs
class BlanForMyBlans {
  const BlanForMyBlans({
    required this.id,
    required this.title,
    required this.category,
    required this.mood,
    required this.dateTime,
    required this.locationLabel,
    required this.participantsCount,
    required this.maxParticipants,
    required this.status,
    this.pendingRequestsCount = 0,
    this.participationStatus,
  });

  final String id;
  final String title;
  final String category;
  final Mood mood;
  final DateTime dateTime;
  final String locationLabel; // "Flexible" / "Area" / "Place name"
  final int participantsCount;
  final int maxParticipants;
  final BlanStatus status; // UPCOMING, PAST, CANCELED
  final int pendingRequestsCount; // Only for created BLANs
  final ParticipationStatus? participationStatus; // For My Activity tab

  String get formattedDate {
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
    return '${months[dateTime.month - 1]} ${dateTime.day}, ${dateTime.year}';
  }

  String get formattedTime {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }
}

/// My Activity data model
class MyActivityData {
  const MyActivityData({
    required this.accepted,
    required this.pending,
    required this.notSelected,
  });

  final List<BlanForMyBlans> accepted;
  final List<BlanForMyBlans> pending;
  final List<BlanForMyBlans> notSelected;
}








