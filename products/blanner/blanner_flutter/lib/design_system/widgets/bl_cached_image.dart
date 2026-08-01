import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../colors.dart';

/// Cached network image widget using cached_network_image package
/// Also supports local asset images (paths starting with 'assets/')
/// Provides automatic caching and placeholder/error handling
class BlCachedImage extends StatelessWidget {
  const BlCachedImage({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.placeholder,
    this.errorWidget,
    this.borderRadius,
  });

  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final Widget? placeholder;
  final Widget? errorWidget;
  final BorderRadius? borderRadius;

  /// Checks if the imageUrl is a local asset path
  bool get _isAssetImage {
    return imageUrl.isNotEmpty && imageUrl.startsWith('assets/');
  }

  @override
  Widget build(BuildContext context) {
    Widget image;

    if (_isAssetImage) {
      // Local asset image
      image = Image.asset(
        imageUrl,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (context, error, stackTrace) {
          return errorWidget ??
              Container(
                color: BlannerColors.surface,
                child: const Icon(Icons.image, size: 48),
              );
        },
      );
    } else if (imageUrl.isEmpty) {
      // Empty URL - show error widget
      image = errorWidget ??
          Container(
            color: BlannerColors.surface,
            child: const Icon(Icons.image, size: 48),
          );
    } else {
      // Network image
      image = CachedNetworkImage(
        imageUrl: imageUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) => placeholder ??
            Container(
              color: BlannerColors.surface,
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        errorWidget: (context, url, error) => errorWidget ??
            Container(
              color: BlannerColors.surface,
              child: const Icon(Icons.image, size: 48),
            ),
        // Cache configuration
        // Only set memCacheWidth/Height if width/height are finite numbers
        memCacheWidth: (width != null && width!.isFinite) ? width!.toInt() : null,
        memCacheHeight: (height != null && height!.isFinite) ? height!.toInt() : null,
        maxWidthDiskCache: 1000,
        maxHeightDiskCache: 1000,
      );
    }

    if (borderRadius != null) {
      return ClipRRect(
        borderRadius: borderRadius!,
        child: image,
      );
    }

    return image;
  }
}

