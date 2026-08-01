package com.blanner.blan;

import com.blanner.dto.CreateBlanRequest;
import com.blanner.model.enums.*;
import org.mapstruct.*;

import java.time.LocalDateTime;

@Mapper(componentModel = "spring", 
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface BlanMapper {
    
    /**
     * Maps CreateBlanRequest to Blan entity with default values
     * Relations (creator, category) must be set manually in the service
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "creator", ignore = true) // Set manually in service
    @Mapping(target = "category", ignore = true) // Set manually in service
    @Mapping(target = "blanLocation", source = "location") // Mapped directly from request
    @Mapping(target = "blanTime", source = "schedule") // Mapped directly from request
    @Mapping(target = "groupSize", source = "groupSize", defaultExpression = "java(com.blanner.model.enums.GroupSize.PLUS_ONE)")
    @Mapping(target = "genderPref", source = "genderPref", defaultExpression = "java(com.blanner.model.enums.GenderPreference.ANY)")
    @Mapping(target = "visibility", source = "visibility", defaultExpression = "java(com.blanner.model.enums.Visibility.PUBLIC)")
    @Mapping(target = "approvalRequired", source = "approvalRequired", defaultValue = "false")
    @Mapping(target = "status", constant = "ACTIVE")
    @Mapping(target = "likeCount", constant = "0")
    @Mapping(target = "commentCount", constant = "0")
    @Mapping(target = "joinCount", constant = "0")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "participations", ignore = true)
    @Mapping(target = "comments", ignore = true)
    @Mapping(target = "reactions", ignore = true)
    Blan toEntity(CreateBlanRequest request);
    
    /**
     * Maps CreateBlanRequest.LocationDto to BlanLocation
     * Automatically maps areaBoundingBox if provided
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "mode", source = "mode", defaultExpression = "java(com.blanner.model.enums.LocationMode.FLEXIBLE)")
    @Mapping(target = "areaBoundingBox", source = "areaBoundingBox")
    BlanLocation toBlanLocation(CreateBlanRequest.LocationDto locationDto);
    
    /**
     * Maps CreateBlanRequest.ScheduleDto to BlanTime
     * Automatically calculates startDatetime if both date and time are provided
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "startDatetime", ignore = true) // Set in @AfterMapping
    BlanTime toBlanTime(CreateBlanRequest.ScheduleDto scheduleDto);
    
    /**
     * Sets startDatetime after mapping if both date and time are provided
     */
    @AfterMapping
    default void setStartDatetime(@MappingTarget BlanTime blanTime, CreateBlanRequest.ScheduleDto scheduleDto) {
        if (scheduleDto != null && scheduleDto.getDate() != null && scheduleDto.getTime() != null) {
            blanTime.setStartDatetime(LocalDateTime.of(scheduleDto.getDate(), scheduleDto.getTime()));
        }
    }
    
    /**
     * Maps CreateBlanRequest.BoundingBox to BlanLocation.BoundingBox
     */
    BlanLocation.BoundingBox toBoundingBox(CreateBlanRequest.BoundingBox boundingBox);
}

