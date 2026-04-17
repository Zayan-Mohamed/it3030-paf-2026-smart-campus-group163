package com.smartcampus.api.controller;

import com.smartcampus.api.dto.AuthResponse;
import com.smartcampus.api.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import com.smartcampus.api.dto.LoginRequest;
import com.smartcampus.api.dto.SignupRequest;
import com.smartcampus.api.dto.TokenResponse;
import com.smartcampus.api.dto.VerifyOtpRequest;
import com.smartcampus.api.dto.ResendOtpRequest;
import com.smartcampus.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for authentication-related endpoints.
 * Provides user information and authentication status.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<TokenResponse> register(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<TokenResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendOtp(request);
        return ResponseEntity.ok().build();
    }
    
    /**
     * Get current authenticated user information.
     * Requires valid JWT token in Authorization header.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse.UserInfo> getCurrentUser(
            @AuthenticationPrincipal User user
    ) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .pictureUrl(user.getPictureUrl())
                .roles(user.getRoles())
                .studentRegistrationNumber(user.getStudentRegistrationNumber())
                .faculty(user.getFaculty())
                .major(user.getMajor())
                .phoneNumber(user.getPhoneNumber())
                .employeeId(user.getEmployeeId())
                .department(user.getDepartment())
                .build();
        
        return ResponseEntity.ok(userInfo);
    }
    
    /**
     * Health check endpoint for authentication service
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Auth service is running");
    }
}
