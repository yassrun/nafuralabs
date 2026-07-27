import 'package:flutter/material.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/area.dart';

/// Area picker page with neighborhoods list and map pin option
/// For now, this is a mock implementation. Replace with actual map integration.
class AreaPickerPage extends StatelessWidget {
  const AreaPickerPage({super.key});

  // Mock neighborhoods - TODO: Replace with actual data from user's city
  static const List<Area> _mockNeighborhoods = [
    Area(
      id: '1',
      name: 'Downtown',
      latitude: 37.7749,
      longitude: -122.4194,
      isNeighborhood: true,
    ),
    Area(
      id: '2',
      name: 'Midtown',
      latitude: 37.7849,
      longitude: -122.4094,
      isNeighborhood: true,
    ),
    Area(
      id: '3',
      name: 'Uptown',
      latitude: 37.7949,
      longitude: -122.3994,
      isNeighborhood: true,
    ),
    Area(
      id: '4',
      name: 'Riverside',
      latitude: 37.8049,
      longitude: -122.3894,
      isNeighborhood: true,
    ),
    Area(
      id: '5',
      name: 'Park District',
      latitude: 37.8149,
      longitude: -122.3794,
      isNeighborhood: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose an area'),
        backgroundColor: BlannerColors.background,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(BlannerSpacing.lg),
        children: [
          // Pick on map option
          InkWell(
            onTap: () async {
              // TODO: Open map picker
              // For now, create a mock area from map pin
              final mockArea = Area(
                id: 'map_pin_${DateTime.now().millisecondsSinceEpoch}',
                name: 'Custom Location',
                latitude: 37.7749,
                longitude: -122.4194,
                radiusKm: 5.0,
                isNeighborhood: false,
              );
              Navigator.pop(context, mockArea);
            },
            child: Container(
              padding: const EdgeInsets.all(BlannerSpacing.lg),
              decoration: BoxDecoration(
                color: BlannerColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(BlannerRadius.medium),
                border: Border.all(
                  color: BlannerColors.primary,
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.map,
                    color: BlannerColors.primary,
                    size: 32,
                  ),
                  const SizedBox(width: BlannerSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pick on map',
                          style: BlannerTextStyles.body1.copyWith(
                            fontWeight: FontWeight.w600,
                            color: BlannerColors.primary,
                          ),
                        ),
                        const SizedBox(height: BlannerSpacing.xs),
                        Text(
                          'Drop a pin on the map',
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: BlannerColors.primary,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: BlannerSpacing.lg),
          Text(
            'Neighborhoods',
            style: BlannerTextStyles.subtitle1,
          ),
          const SizedBox(height: BlannerSpacing.sm),
          // Neighborhoods list
          ..._mockNeighborhoods.map((neighborhood) {
            return Padding(
              padding: const EdgeInsets.only(bottom: BlannerSpacing.sm),
              child: InkWell(
                onTap: () {
                  Navigator.pop(context, neighborhood);
                },
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
                        Icons.location_on,
                        color: BlannerColors.primary,
                      ),
                      const SizedBox(width: BlannerSpacing.md),
                      Expanded(
                        child: Text(
                          neighborhood.name,
                          style: BlannerTextStyles.body1.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.arrow_forward_ios,
                        size: 16,
                        color: BlannerColors.textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}

