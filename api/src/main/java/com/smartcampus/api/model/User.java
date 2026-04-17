package com.smartcampus.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * User entity representing authenticated users in the Smart Campus system.
 * Users authenticate via Google OAuth 2.0 and are assigned roles for RBAC.
 */
@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email"),
    @Index(name = "idx_user_google_id", columnList = "google_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * User's Google ID (OAuth sub claim). Nullable for local accounts.
     */
    @Column(name = "google_id", unique = true)
    private String googleId;
    
    /**
     * User's password for local auth
     */
    @Column(name = "password")
    private String password;
    
    /**
     * User's email address from Google OAuth
     */
    @Column(unique = true, nullable = false)
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
    
    /**
     * User's full name from Google OAuth
     */
    @Column(nullable = false)
    @NotBlank(message = "Name is required")
    private String name;
    
    /**
     * User's profile picture URL from Google OAuth
     */
    @Column(name = "picture_url")
    private String pictureUrl;

    /**
     * Student registration number
     */
    @Column(name = "student_registration_number", unique = true)
    private String studentRegistrationNumber;

    /**
     * Student faculty
     */
    @Column(name = "faculty")
    private String faculty;

    /**
     * Student major
     */
    @Column(name = "major")
    private String major;

    /**
     * User phone number
     */
    @Column(name = "phone_number")
    private String phoneNumber;

    /**
     * Staff/Admin Employee ID
     */
    @Column(name = "employee_id", unique = true)
    private String employeeId;

    /**
     * Staff/Admin Department
     */
    @Column(name = "department")
    private String department;
    
    /**
     * User's roles in the system (STUDENT, STAFF, ADMIN)
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Set<Role> roles = new HashSet<>();
    
    /**
     * Whether the user account is active
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /**
     * User's OTP code for email verification
     */
    @Column(name = "otp_code", length = 6)
    private String otpCode;

    /**
     * OTP code expiration time
     */
    @Column(name = "otp_expiry")
    private LocalDateTime otpExpiry;
    
    /**
     * Timestamp when the user was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Timestamp when the user was last updated
     */
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * Timestamp of last login
     */
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
    /**
     * Add a role to this user
     */
    public void addRole(Role role) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.add(role);
    }
    
    /**
     * Check if user has a specific role
     */
    public boolean hasRole(Role role) {
        return this.roles != null && this.roles.contains(role);
    }
}
