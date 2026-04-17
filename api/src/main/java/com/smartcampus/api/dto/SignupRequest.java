package com.smartcampus.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Student Registration Number is required")
    private String studentRegistrationNumber;

    @NotBlank(message = "Faculty is required")
    private String faculty;

    @NotBlank(message = "Major is required")
    private String major;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;
}
