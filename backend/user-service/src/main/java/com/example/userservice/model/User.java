package com.example.userservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Size(min = 4, max = 50, message = "Username must have characters between 4 and 50")
    @Column(name = "user_name", unique = true)
    private String username;

    @Column(name = "email_id", unique = true)
    @Email
    private String emailId;

    @Size(min = 6, max = 512)
    private String password;

    private String pfpUrl;

    private String country;

    private Integer rating;

    @Column(name = "streak")
    private Integer streak = 0;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    public User() {
    }

    public User(Long userId, String username, String emailId, String password, String pfpUrl, String country,
            Integer rating, Integer streak, LocalDateTime lastLoginDate) {
        this.userId = userId;
        this.username = username;
        this.emailId = emailId;
        this.password = password;
        this.pfpUrl = pfpUrl;
        this.country = country;
        this.rating = rating;
        this.streak = streak;
        this.lastLoginDate = lastLoginDate;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmailId() {
        return emailId;
    }

    public void setEmailId(String emailId) {
        this.emailId = emailId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPfpUrl() {
        return pfpUrl;
    }

    public void setPfpUrl(String pfpUrl) {
        this.pfpUrl = pfpUrl;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public Integer getStreak() {
        return streak;
    }

    public void setStreak(Integer streak) {
        this.streak = streak;
    }

    public LocalDateTime getLastLoginDate() {
        return lastLoginDate;
    }

    public void setLastLoginDate(LocalDateTime lastLoginDate) {
        this.lastLoginDate = lastLoginDate;
    }
}
