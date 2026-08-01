package com.blanner.dto;

import com.blanner.model.enums.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {
    private String name;
    private String email;
    private String bio;
    private String photoUrl;
    private String avatarUrl;
    private Gender gender;
    private LocalDate birthdate;
    private String city;
    private String interests;
}
