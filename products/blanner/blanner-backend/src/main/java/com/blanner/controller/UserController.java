package com.blanner.controller;

import com.blanner.dto.CreateUserRequest;
import com.blanner.dto.UpdateUserRequest;
import com.blanner.dto.UserDto;
import com.blanner.model.entity.User;
import com.blanner.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        User currentUser = userService.getCurrentUserOrCreate();
        return ResponseEntity.ok(convertToDto(currentUser));
    }
    
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDto> userDtos = users.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(userDtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        return userService.getUserById(id)
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/username/{username}")
    public ResponseEntity<UserDto> getUserByUsername(@PathVariable String username) {
        return userService.findByUsername(username)
                .map(this::convertToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request) {
        User userUpdate = User.builder()
                .name(request.getName())
                .bio(request.getBio())
                .photoUrl(request.getPhotoUrl())
                .gender(request.getGender())
                .birthdate(request.getBirthdate())
                .city(request.getCity())
                .interests(request.getInterests())
                .build();
        
        User updatedUser = userService.updateCurrentUser(userUpdate);
        return ResponseEntity.ok(convertToDto(updatedUser));
    }
    
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername())
                .bio(user.getBio())
                .photoUrl(user.getPhotoUrl())
                .gender(user.getGender())
                .birthdate(user.getBirthdate())
                .city(user.getCity())
                .interests(user.getInterests())
                .verifiedFlag(user.getVerifiedFlag())
                .build();
    }
}
