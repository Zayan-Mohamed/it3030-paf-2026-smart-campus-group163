package com.smartcampus.api.dto;

import com.smartcampus.api.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Response DTO for authentication endpoints.
 * Contains JWT token and user information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    /**
     * JWT access token
     */
    private String token;
    
    /**
     * Token type (always "Bearer")
     */
    @Builder.Default
    private String tokenType = "Bearer";
    
    /**
     * User details
     */
    private UserInfo user;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String email;
        private String name;
        private String pictureUrl;
        private Set<Role> roles;
        private String studentRegistrationNumber;
        private String faculty;
        private String major;
        private String phoneNumber;
    private String employeeId;
    private String department;
    }
}
