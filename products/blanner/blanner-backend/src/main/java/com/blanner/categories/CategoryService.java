package com.blanner.categories;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {
    
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;
    
    public List<CategoryDto> getAllActiveCategoriesOrdered() {
        List<Category> categories = categoryRepository.findByActiveTrueOrderByOrderIndexAsc();
        return categoryMapper.toDtoList(categories);
    }
}

