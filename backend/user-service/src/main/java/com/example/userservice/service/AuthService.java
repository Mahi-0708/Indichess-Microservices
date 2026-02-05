package com.example.userservice.service;

import com.example.userservice.model.User;
import com.example.userservice.repo.UserRepo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public User save(User user) {
        System.out.println("Processing signup for user: " + user.getUsername());
        if (userRepo.getUserByUsername(user.getUsername()) != null) {
            System.out.println("Signup failed: Username already exists");
            throw new RuntimeException("Username already exists");
        }
        if (userRepo.getUserByEmailId(user.getEmailId()) != null) {
            System.out.println("Signup failed: Email already registered");
            throw new RuntimeException("Email already registered");
        }

        try {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setRating(250); // default rating
            User saved = userRepo.save(user);
            System.out.println("Signup successful for user: " + saved.getUsername());
            return saved;
        } catch (Exception e) {
            System.err.println("Database error during signup: " + e.getMessage());
            throw new RuntimeException("Database error: " + e.getMessage());
        }
    }

    public User getUserByUsername(String username) {
        return userRepo.getUserByUsername(username);
    }

    public User updateUser(String oldUsername, String newUsername, String newEmail) {
        User user = userRepo.getUserByUsername(oldUsername);
        if (user == null) {
            throw new RuntimeException("User not found");
        }

        // Check if new username is taken by someone else
        if (!oldUsername.equals(newUsername)) {
            if (userRepo.getUserByUsername(newUsername) != null) {
                throw new RuntimeException("Username already exists");
            }
        }

        // Check if new email is taken by someone else
        if (!user.getEmailId().equals(newEmail)) {
            if (userRepo.getUserByEmailId(newEmail) != null) {
                throw new RuntimeException("Email already registered");
            }
        }

        user.setUsername(newUsername);
        user.setEmailId(newEmail);
        return userRepo.save(user);
    }

    public void updateStreak(User user) {
        LocalDateTime now = LocalDateTime.now();
        if (user.getLastLoginDate() == null) {
            // First time login
            user.setStreak(1);
        } else {
            long daysBetween = ChronoUnit.DAYS.between(user.getLastLoginDate().toLocalDate(), now.toLocalDate());
            
            if (daysBetween == 1) {
                // Consecutive day
                user.setStreak(user.getStreak() + 1);
            } else if (daysBetween > 1) {
                // Day missed, reset streak
                user.setStreak(1);
            }
            // If daysBetween == 0 (logged in same day), do nothing to streak
        }
        user.setLastLoginDate(now);
        userRepo.save(user);
    }
}
