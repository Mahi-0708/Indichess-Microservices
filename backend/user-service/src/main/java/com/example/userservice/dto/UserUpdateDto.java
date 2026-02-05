package com.example.userservice.dto;

public class UserUpdateDto {
    private String username;
    private String emailId;

    public UserUpdateDto() {
    }

    public UserUpdateDto(String username, String emailId) {
        this.username = username;
        this.emailId = emailId;
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
}
