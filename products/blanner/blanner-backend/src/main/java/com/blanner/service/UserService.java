package com.blanner.service;

import com.blanner.model.entity.User;
import com.blanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    
    // Hardcoded test user username
    private static final String TEST_USER_USERNAME = "testuser";

    public Optional<User> getCurrentUser() {
        return userRepository.findByUsername(TEST_USER_USERNAME);
    }

    public User getCurrentUserOrCreate() {
        return getCurrentUser()
                .orElseGet(() -> {
                    // Check if user exists by email (in case username check failed but user exists)
                    Optional<User> existingByEmail = userRepository.findByEmail("testuser@example.com");
                    if (existingByEmail.isPresent()) {
                        return existingByEmail.get();
                    }
                    return createTestUser();
                });
    }

    private User createTestUser() {
        // Create a hardcoded test user
        // Double-check that user doesn't exist before creating
        if (userRepository.existsByUsername(TEST_USER_USERNAME) || 
            userRepository.existsByEmail("testuser@example.com")) {
            // User already exists, try to find it
            return userRepository.findByUsername(TEST_USER_USERNAME)
                    .orElseGet(() -> userRepository.findByEmail("testuser@example.com")
                            .orElseThrow(() -> new IllegalStateException("User should exist but was not found")));
        }
        
        User user = User.builder()
                .name("Test User")
                .username(TEST_USER_USERNAME)
                .email("testuser@example.com")
                .verifiedFlag(true)
                .build();
        return userRepository.save(user);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(UUID id) {
        return userRepository.findById(id);
    }

    public User updateCurrentUser(User userUpdate) {
        User currentUser = getCurrentUserOrCreate();
        
        if (userUpdate.getName() != null) {
            currentUser.setName(userUpdate.getName());
        }
        if (userUpdate.getBio() != null) {
            currentUser.setBio(userUpdate.getBio());
        }
        if (userUpdate.getPhotoUrl() != null) {
            currentUser.setPhotoUrl(userUpdate.getPhotoUrl());
        }
        if (userUpdate.getGender() != null) {
            currentUser.setGender(userUpdate.getGender());
        }
        if (userUpdate.getBirthdate() != null) {
            currentUser.setBirthdate(userUpdate.getBirthdate());
        }
        if (userUpdate.getCity() != null) {
            currentUser.setCity(userUpdate.getCity());
        }
        if (userUpdate.getInterests() != null) {
            currentUser.setInterests(userUpdate.getInterests());
        }

        return userRepository.save(currentUser);
    }
}