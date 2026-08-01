import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../design_system/colors.dart';
import '../../../../design_system/radius.dart';
import '../../../../design_system/spacing.dart';
import '../../../../design_system/typography.dart';
import '../models/area.dart';
import '../models/enums.dart';
import '../models/real_place.dart';
import '../providers/create_blan_provider.dart';
import 'place_picker_bottom_sheet.dart';
import 'area_picker_page.dart';

class StepLocationOptions extends ConsumerWidget {
  const StepLocationOptions({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(createBlanProvider);
    final data = state.data;
    final notifier = ref.read(createBlanProvider.notifier);

    return ListView(
      padding: const EdgeInsets.all(BlannerSpacing.lg),
      children: [
        Text(
          'Location Options',
          style: BlannerTextStyles.headline1,
        ),
        const SizedBox(height: BlannerSpacing.md),
        Text(
          'Choose where you want to meet (optional)',
          style: BlannerTextStyles.body2.copyWith(
            color: BlannerColors.textSecondary,
          ),
        ),
        const SizedBox(height: BlannerSpacing.lg),
        // Card A: Choose an exact place
        _buildPlaceCard(context, ref, data, notifier),
        const SizedBox(height: BlannerSpacing.md),
        // Card B: Choose an area
        _buildAreaCard(context, ref, data, notifier),
        const SizedBox(height: BlannerSpacing.lg),
        // Decide Later button
        TextButton(
          onPressed: () {
            notifier.updateData(
              data.copyWith(
                place: null,
                area: null,
                coverImageUrl: data.category?.getDefaultImageUrl(),
              ),
            );
          },
          child: Text(
            'Decide Later',
            style: BlannerTextStyles.body1.copyWith(
              color: BlannerColors.textSecondary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceCard(
    BuildContext context,
    WidgetRef ref,
    data,
    notifier,
  ) {
    final hasPlace = data.place != null;
    final category = data.category ?? CategoryEnum.other;
    final categoryEmoji = category.toEmoji();

    return InkWell(
      onTap: () async {
        final selectedPlace = await showModalBottomSheet<RealPlace>(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (context) => PlacePickerBottomSheet(
            category: category,
          ),
        );

        if (selectedPlace != null) {
          // Clear area if place is selected
          final newData = data.copyWith(
            place: selectedPlace,
            area: null,
            coverImageUrl: selectedPlace.photoUrls.isNotEmpty
                ? selectedPlace.photoUrls.first
                : category.getDefaultImageUrl(),
          );
          notifier.updateData(newData);
        }
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
            // Leading icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: BlannerColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(BlannerRadius.small),
              ),
              child: Center(
                child: Text(
                  categoryEmoji,
                  style: const TextStyle(fontSize: 24),
                ),
              ),
            ),
            const SizedBox(width: BlannerSpacing.md),
            // Content
            Expanded(
              child: hasPlace
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (data.place!.photoUrls.isNotEmpty)
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  borderRadius:
                                      BorderRadius.circular(BlannerRadius.small),
                                  image: DecorationImage(
                                    image: NetworkImage(
                                      data.place!.photoUrls.first,
                                    ),
                                    fit: BoxFit.cover,
                                  ),
                                ),
                              ),
                            if (data.place!.photoUrls.isNotEmpty)
                              const SizedBox(width: BlannerSpacing.sm),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    data.place!.name,
                                    style: BlannerTextStyles.body1.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: BlannerSpacing.xs),
                                  Text(
                                    data.place!.address,
                                    style: BlannerTextStyles.caption.copyWith(
                                      color: BlannerColors.textSecondary,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Choose an exact place',
                          style: BlannerTextStyles.body1.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: BlannerSpacing.xs),
                        Text(
                          'Search places near you (optional)',
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
            ),
            // Trailing icon/button
            if (hasPlace)
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () {
                  notifier.updateData(
                    data.copyWith(
                      place: null,
                      coverImageUrl: category.getDefaultImageUrl(),
                    ),
                  );
                },
                color: BlannerColors.textSecondary,
              )
            else
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: BlannerColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAreaCard(
    BuildContext context,
    WidgetRef ref,
    data,
    notifier,
  ) {
    final hasArea = data.area != null;

    return InkWell(
      onTap: () async {
        final selectedArea = await Navigator.push<Area>(
          context,
          MaterialPageRoute(
            builder: (context) => const AreaPickerPage(),
          ),
        );

        if (selectedArea != null) {
          // Clear place if area is selected
          final category = data.category ?? CategoryEnum.other;
          final newData = data.copyWith(
            area: selectedArea,
            place: null,
            coverImageUrl: category.getDefaultImageUrl(),
          );
          notifier.updateData(newData);
        }
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
            // Leading icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: BlannerColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(BlannerRadius.small),
              ),
              child: const Center(
                child: Text(
                  '🗺',
                  style: TextStyle(fontSize: 24),
                ),
              ),
            ),
            const SizedBox(width: BlannerSpacing.md),
            // Content
            Expanded(
              child: hasArea
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          data.area!.name,
                          style: BlannerTextStyles.body1.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: BlannerSpacing.xs),
                        Text(
                          data.area!.isNeighborhood
                              ? 'Neighborhood'
                              : 'Custom location',
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.textSecondary,
                          ),
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Choose an area',
                          style: BlannerTextStyles.body1.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: BlannerSpacing.xs),
                        Text(
                          'Select a neighborhood or place a pin',
                          style: BlannerTextStyles.caption.copyWith(
                            color: BlannerColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
            ),
            // Trailing icon/button
            if (hasArea)
              TextButton(
                onPressed: () {
                  notifier.updateData(
                    data.copyWith(area: null),
                  );
                },
                child: Text(
                  'Change',
                  style: BlannerTextStyles.body2.copyWith(
                    color: BlannerColors.primary,
                  ),
                ),
              )
            else
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: BlannerColors.textSecondary,
              ),
          ],
        ),
      ),
    );
  }
}

