package com.smartcampus.api.service;

import com.smartcampus.api.dto.LoginRequest;
import com.smartcampus.api.dto.SignupRequest;
import com.smartcampus.api.dto.TokenResponse;
import com.smartcampus.api.dto.VerifyOtpRequest;
import com.smartcampus.api.dto.ResendOtpRequest;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;

    public TokenResponse register(SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use");
        }

        String studentRegNum = request.getStudentRegistrationNumber();
        if (studentRegNum != null && studentRegNum.trim().isEmpty()) {
            studentRegNum = null;
        }
        
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(false) // User is not enabled until OTP verification
                .studentRegistrationNumber(studentRegNum)
                .faculty(request.getFaculty())
                .major(request.getMajor())
                .phoneNumber(request.getPhoneNumber())
                .build();
        
        user.addRole(Role.STUDENT); // Default role
        userRepository.save(user);

        try {
            otpService.generateAndSendOtp(user);
        } catch (Exception e) {
            // Delete user if OTP sending fails, to allow them to retry registration
            userRepository.delete(user);
            throw new IllegalArgumentException("Failed to send OTP email: " + e.getMessage());
        }

        // We return an empty token to indicate they need to verify OTP, or could change return type.
        return new TokenResponse("");
    }

    public TokenResponse verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or OTP"));

        if (user.getEnabled()) {
            throw new IllegalArgumentException("User is already verified");
        }

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new IllegalArgumentException("Invalid OTP code");
        }

        if (user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("OTP code has expired");
        }

        // Verify user
        user.setEnabled(true);
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new TokenResponse(token);
    }

    public TokenResponse login(LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());
        
        if (userOptional.isEmpty() || userOptional.get().getPassword() == null) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOptional.get();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        if (!user.getEnabled()) {
            throw new IllegalArgumentException("Please verify your email via OTP before logging in");
        }

        String token = jwtService.generateToken(user);
        return new TokenResponse(token);
    }

    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getEnabled()) {
            throw new IllegalArgumentException("User is already verified");
        }

        otpService.generateAndSendOtp(user);
    }
}
