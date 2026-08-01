package com.blanner.mapper;

import com.blanner.dto.CreateUserRequest;
import com.blanner.dto.UpdateUserRequest;
import com.blanner.dto.UserDto;
import com.blanner.model.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {
    
    /**
     * Maps User entity to UserDto
     */
    UserDto toDto(User user);
    
    /**
     * Maps CreateUserRequest to User entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "phoneVerified", ignore = true)
    @Mapping(target = "verifiedFlag", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "blans", ignore = true)
    @Mapping(target = "participations", ignore = true)
    @Mapping(target = "comments", ignore = true)
    @Mapping(target = "reactions", ignore = true)
    User toEntity(CreateUserRequest request);
    
    /**
     * Updates existing User entity with UpdateUserRequest data
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "phone", ignore = true)
    @Mapping(target = "phoneVerified", ignore = true)
    @Mapping(target = "verifiedFlag", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "blans", ignore = true)
    @Mapping(target = "participations", ignore = true)
    @Mapping(target = "comments", ignore = true)
    @Mapping(target = "reactions", ignore = true)
    void updateUserFromRequest(UpdateUserRequest request, @MappingTarget User user);
}
