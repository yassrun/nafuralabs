import '../../../core/utils/category_image_helper.dart';
import '../../home_feed/data/participation_status.dart';

/// BLAN model for "My BLANs" feature
/// Represents a BLAN that the user created, is participating in, or has requested
class MyBlan {
  const MyBlan({
    required this.id,
    required this.title,
    required this.category,
    required this.dateTime,
    required this.locationName,
    required this.imageUrl,
    required this.currentParticipants,
    required this.maxParticipants,
    required this.status,
    required this.isOrganizer,
    this.organizerName,
    this.pendingRequests = 0,
  });

  final String id;
  final String title;
  final String category;
  final DateTime dateTime;
  final String locationName;
  final String imageUrl;
  final int currentParticipants;
  final int maxParticipants;
  final ParticipationStatus status;
  final bool isOrganizer;
  final String? organizerName;
  final int pendingRequests; // Only for created BLANs

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

  /// Gets the image URL to display, with fallback to category default image
  String get displayImageUrl {
    // If imageUrl is provided and not empty, use it
    if (imageUrl.isNotEmpty) {
      return imageUrl;
    }
    // Otherwise, try to get the category default image
    final categoryImage = CategoryImageHelper.getCategoryImageAsset(category);
    return categoryImage ?? '';
  }
}

/// Request model for BLAN join requests
class BlanRequest {
  const BlanRequest({
    required this.id,
    required this.blanId,
    required this.userId,
    required this.userName,
    this.userAvatarUrl,
    required this.requestedAt,
  });

  final String id;
  final String blanId;
  final String userId;
  final String userName;
  final String? userAvatarUrl;
  final DateTime requestedAt;

  String get formattedRequestTime {
    final now = DateTime.now();
    final difference = now.difference(requestedAt);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }
}

