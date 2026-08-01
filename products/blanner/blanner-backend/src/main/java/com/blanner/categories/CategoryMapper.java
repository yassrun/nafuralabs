package com.blanner.categories;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    
    CategoryDto toDto(Category category);
    
    List<CategoryDto> toDtoList(List<Category> categories);
}

