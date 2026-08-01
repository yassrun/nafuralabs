package com.blanner.categories;

import com.blanner.model.enums.Billability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private String id;
    private String name;
    private String defaultImage;
    private List<String> googleTags;
    private Billability billability;
    private Integer orderIndex;
    private String locationTitle;
}

