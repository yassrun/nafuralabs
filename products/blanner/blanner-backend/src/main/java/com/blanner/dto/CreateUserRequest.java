package com.blanner.dto;

import com.blanner.model.enums.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Username is required")
    private String username;
    
    private String email;
    
    private String bio;
    private String photoUrl;
    private String avatarUrl;
    
    @NotNull(message = "Gender is required")
    private Gender gender;
    
    private LocalDate birthdate;
    private String city;
    private String interests;
}
