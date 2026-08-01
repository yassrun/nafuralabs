import '../../../core/utils/category_image_helper.dart';
import 'participation_status.dart';

class Blan {
  const Blan({
    required this.id,
    required this.title,
    required this.category,
    required this.dateTime,
    required this.locationName,
    required this.distanceKm,
    required this.imageUrl,
    required this.priceType,
    required this.currentParticipants,
    required this.maxParticipants,
    required this.organizerName,
    this.status = ParticipationStatus.notRequested,
    this.userLiked = false,
    this.userSaved = false,
    this.likeCount = 0,
    this.saveCount = 0,
  });

  final String id;
  final String title;
  final String category;
  final DateTime dateTime;
  final String locationName;
  final double distanceKm;
  final String imageUrl;
  final String priceType;
  final int currentParticipants;
  final int maxParticipants;
  final String organizerName;
  final ParticipationStatus status;
  final bool userLiked;
  final bool userSaved;
  final int likeCount;
  final int saveCount;

  Blan copyWith({
    String? id,
    String? title,
    String? category,
    DateTime? dateTime,
    String? locationName,
    double? distanceKm,
    String? imageUrl,
    String? priceType,
    int? currentParticipants,
    int? maxParticipants,
    String? organizerName,
    ParticipationStatus? status,
    bool? userLiked,
    bool? userSaved,
    int? likeCount,
    int? saveCount,
  }) {
    return Blan(
      id: id ?? this.id,
      title: title ?? this.title,
      category: category ?? this.category,
      dateTime: dateTime ?? this.dateTime,
      locationName: locationName ?? this.locationName,
      distanceKm: distanceKm ?? this.distanceKm,
      imageUrl: imageUrl ?? this.imageUrl,
      priceType: priceType ?? this.priceType,
      currentParticipants: currentParticipants ?? this.currentParticipants,
      maxParticipants: maxParticipants ?? this.maxParticipants,
      organizerName: organizerName ?? this.organizerName,
      status: status ?? this.status,
      userLiked: userLiked ?? this.userLiked,
      userSaved: userSaved ?? this.userSaved,
      likeCount: likeCount ?? this.likeCount,
      saveCount: saveCount ?? this.saveCount,
    );
  }

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
    return '${months[dateTime.month - 1]} ${dateTime.day}';
  }

  String get formattedTime {
    final hour = dateTime.hour;
    final minute = dateTime.minute.toString().padLeft(2, '0');
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '$displayHour:$minute $period';
  }

  String get formattedDistance {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).round()}m away';
    }
    return '${distanceKm.toStringAsFixed(1)}km away';
  }

  /// Gets the image URL to display, with fallback to category default image
  /// Always prioritizes local assets over backend URLs
  String get displayImageUrl {
    print('📸 Blan.displayImageUrl called - id: $id, category: "$category", imageUrl: "$imageUrl"');
    
    // Always try to get local asset image first (priority)
    final categoryImage = CategoryImageHelper.getCategoryImageAsset(category);
    if (categoryImage != null) {
      print('📸 Blan.displayImageUrl: Using local category image: $categoryImage');
      return categoryImage;
    }
    
    // If no local asset, check if imageUrl is a placeholder or invalid
    final isPlaceholder = imageUrl.contains('picsum.photos') || 
                         imageUrl.contains('placeholder') ||
                         imageUrl.isEmpty;
    
    if (!isPlaceholder && imageUrl.isNotEmpty) {
      print('📸 Blan.displayImageUrl: Using backend imageUrl: $imageUrl');
      return imageUrl;
    }
    
    // Fallback to empty if no image found
    print('📸 Blan.displayImageUrl: No image found, returning empty');
    return '';
  }
}

