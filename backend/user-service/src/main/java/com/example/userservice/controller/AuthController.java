package com.example.userservice.controller;

import com.example.userservice.model.DTO.LoginDto;
import com.example.userservice.model.DTO.LoginResponseDto;
import com.example.userservice.dto.UserUpdateDto;
import com.example.userservice.model.User;
import com.example.userservice.service.AuthService;
import com.example.userservice.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;

@RestController
@RequestMapping("/auth")   // 🔥 THIS IS THE KEY FIX
@CrossOrigin(value = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(
            AuthService authService,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // Health check
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("User Service Auth is UP");
    }

    // ✅ SIGNUP
    @PostMapping("/signup")
    public ResponseEntity<?> handleSignup(@RequestBody User user) {
        try {
            return new ResponseEntity<>(authService.save(user), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>("Signup failed: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    // ✅ LOGIN
    @PostMapping("/login")
    public ResponseEntity<?> handleLogin(
            HttpServletResponse response,
            @RequestBody LoginDto loginDto) {

        Authentication authObject = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginDto.getUsername(),
                        loginDto.getPassword()
                )
        );

        if (authObject.isAuthenticated()) {
            String token = jwtService.generateToken(loginDto.getUsername());

            ResponseCookie cookie = ResponseCookie.from("JWT", token)
                    .httpOnly(true)
                    .secure(false)       // true in production (HTTPS)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(3600)
                    .build();

            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            // 🔥 STREAK LOGIC
            User user = authService.getUserByUsername(loginDto.getUsername());
            if (user != null) {
                authService.updateStreak(user);
            }

            return ResponseEntity.ok(new LoginResponseDto(token, "Login successful"));
        }

        return new ResponseEntity<>(
                new LoginResponseDto(null, "Authentication failed"),
                HttpStatus.UNAUTHORIZED
        );
    }

    // ✅ LOGOUT
    @PostMapping("/logout")
    public ResponseEntity<?> handleLogout(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from("JWT", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0) // Expire immediately
                .build();

        response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("Logged out successfully");
    }

    // ✅ GET CURRENT USER
    @GetMapping("/user")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("Not authenticated", HttpStatus.UNAUTHORIZED);
        }

        String username = authentication.getName();
        User user = authService.getUserByUsername(username);

        if (user == null) {
            return new ResponseEntity<>("User not found", HttpStatus.NOT_FOUND);
        }

        // Return user details (be careful with password, might want a DTO)
        return ResponseEntity.ok(user);
    }

    // ✅ UPDATE PROFILE
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(Authentication authentication, @RequestBody UserUpdateDto updateDto, HttpServletResponse response) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return new ResponseEntity<>("Not authenticated", HttpStatus.UNAUTHORIZED);
        }

        String oldUsername = authentication.getName();
        try {
            User updatedUser = authService.updateUser(oldUsername, updateDto.getUsername(), updateDto.getEmailId());
            
            // If username changed, we might need to issue a new JWT or handle it on frontend
            String newToken = jwtService.generateToken(updatedUser.getUsername());
            ResponseCookie cookie = ResponseCookie.from("JWT", newToken)
                    .httpOnly(true)
                    .secure(false)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(3600)
                    .build();

            response.setHeader(HttpHeaders.SET_COOKIE, cookie.toString());
            
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
