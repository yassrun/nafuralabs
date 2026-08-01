package com.blanner.dto;

import com.blanner.model.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private UUID id;
    private String name;
    private String username;
    private String email;
    private String bio;
    private String photoUrl;
    private String avatarUrl;
    private Gender gender;
    private LocalDate birthdate;
    private String city;
    private String interests;
    private Boolean verifiedFlag;
}
