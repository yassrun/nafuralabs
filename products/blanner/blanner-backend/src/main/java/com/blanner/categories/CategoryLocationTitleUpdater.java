package com.blanner.categories;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class CategoryLocationTitleUpdater {
    
    private final CategoryRepository categoryRepository;
    
    private static final Map<String, String> CATEGORY_LOCATION_TITLES = Map.ofEntries(
        Map.entry("Coffee", "Pick your coffee spot"),
        Map.entry("Food / Restaurants", "Pick your restaurant"),
        Map.entry("Drinks / Rooftop / Lounge", "Pick your bar or rooftop"),
        Map.entry("Party / Night Out", "Pick the place for your night out"),
        Map.entry("Games", "Pick your game spot"),
        Map.entry("Gym / Fitness", "Pick your workout spot"),
        Map.entry("Outdoor / Nature", "Pick your outdoor area"),
        Map.entry("Cinema", "Pick your cinema"),
        Map.entry("Study / Work", "Pick your study or work spot"),
        Map.entry("Volunteer / Community", "Pick the community spot"),
        Map.entry("At Home", "Pick your home area"),
        Map.entry("Travel", "Pick your travel destination")
    );
    
    @PostConstruct
    public void updateLocationTitles() {
        log.info("Starting location title update for categories...");
        
        for (Map.Entry<String, String> entry : CATEGORY_LOCATION_TITLES.entrySet()) {
            String categoryName = entry.getKey();
            String locationTitle = entry.getValue();
            
            categoryRepository.findByName(categoryName).ifPresent(category -> {
                if (category.getLocationTitle() == null) {
                    category.setLocationTitle(locationTitle);
                    categoryRepository.save(category);
                    log.debug("Updated locationTitle for category: {} -> {}", categoryName, locationTitle);
                } else {
                    log.debug("Category '{}' already has locationTitle: '{}', skipping", categoryName, category.getLocationTitle());
                }
            });
        }
        
        log.info("Location title update completed. Processed {} categories.", CATEGORY_LOCATION_TITLES.size());
    }
}

