package com.blanner.categories;

import com.blanner.model.enums.Billability;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {
    
    @Mock
    private CategoryRepository categoryRepository;
    
    @Mock
    private CategoryMapper categoryMapper;
    
    @InjectMocks
    private CategoryService categoryService;
    
    private Category activeCategory1;
    private Category activeCategory2;
    private Category inactiveCategory;
    private CategoryDto dto1;
    private CategoryDto dto2;
    
    @BeforeEach
    void setUp() {
        activeCategory1 = Category.builder()
                .id("1")
                .name("Coffee")
                .orderIndex(1)
                .active(true)
                .build();
        
        activeCategory2 = Category.builder()
                .id("2")
                .name("Food")
                .orderIndex(2)
                .active(true)
                .build();
        
        inactiveCategory = Category.builder()
                .id("3")
                .name("Inactive")
                .orderIndex(0)
                .active(false)
                .build();
        
        dto1 = CategoryDto.builder()
                .id("1")
                .name("Coffee")
                .orderIndex(1)
                .build();
        
        dto2 = CategoryDto.builder()
                .id("2")
                .name("Food")
                .orderIndex(2)
                .build();
    }
    
    @Test
    void testGetAllActiveCategoriesOrdered_ReturnsOnlyActiveCategories() {
        // Given
        List<Category> activeCategories = Arrays.asList(activeCategory1, activeCategory2);
        List<CategoryDto> expectedDtos = Arrays.asList(dto1, dto2);
        
        when(categoryRepository.findByActiveTrueOrderByOrderIndexAsc())
                .thenReturn(activeCategories);
        when(categoryMapper.toDtoList(activeCategories))
                .thenReturn(expectedDtos);
        
        // When
        List<CategoryDto> result = categoryService.getAllActiveCategoriesOrdered();
        
        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Coffee", result.get(0).getName());
        assertEquals("Food", result.get(1).getName());
        verify(categoryRepository).findByActiveTrueOrderByOrderIndexAsc();
        verify(categoryMapper).toDtoList(activeCategories);
    }
    
    @Test
    void testGetAllActiveCategoriesOrdered_IgnoresInactiveCategories() {
        // Given
        List<Category> activeCategories = Arrays.asList(activeCategory1, activeCategory2);
        List<CategoryDto> expectedDtos = Arrays.asList(dto1, dto2);
        
        when(categoryRepository.findByActiveTrueOrderByOrderIndexAsc())
                .thenReturn(activeCategories);
        when(categoryMapper.toDtoList(activeCategories))
                .thenReturn(expectedDtos);
        
        // When
        List<CategoryDto> result = categoryService.getAllActiveCategoriesOrdered();
        
        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        // Verify inactive category is not in the result
        assertTrue(result.stream().noneMatch(dto -> dto.getName().equals("Inactive")));
    }
    
    @Test
    void testGetAllActiveCategoriesOrdered_ReturnsEmptyListWhenNoActiveCategories() {
        // Given
        when(categoryRepository.findByActiveTrueOrderByOrderIndexAsc())
                .thenReturn(Arrays.asList());
        when(categoryMapper.toDtoList(anyList()))
                .thenReturn(Arrays.asList());
        
        // When
        List<CategoryDto> result = categoryService.getAllActiveCategoriesOrdered();
        
        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }
    
    @Test
    void testGetAllActiveCategoriesOrdered_ReturnsCategoriesInOrder() {
        // Given - categories with different order indices
        Category cat1 = Category.builder().id("1").name("Third").orderIndex(3).active(true).build();
        Category cat2 = Category.builder().id("2").name("First").orderIndex(1).active(true).build();
        Category cat3 = Category.builder().id("3").name("Second").orderIndex(2).active(true).build();
        
        List<Category> categories = Arrays.asList(cat2, cat3, cat1); // Repository should return sorted
        List<CategoryDto> dtos = Arrays.asList(
            CategoryDto.builder().id("2").name("First").orderIndex(1).build(),
            CategoryDto.builder().id("3").name("Second").orderIndex(2).build(),
            CategoryDto.builder().id("1").name("Third").orderIndex(3).build()
        );
        
        when(categoryRepository.findByActiveTrueOrderByOrderIndexAsc())
                .thenReturn(categories);
        when(categoryMapper.toDtoList(categories))
                .thenReturn(dtos);
        
        // When
        List<CategoryDto> result = categoryService.getAllActiveCategoriesOrdered();
        
        // Then
        assertEquals(3, result.size());
        assertEquals(1, result.get(0).getOrderIndex());
        assertEquals(2, result.get(1).getOrderIndex());
        assertEquals(3, result.get(2).getOrderIndex());
    }
}

