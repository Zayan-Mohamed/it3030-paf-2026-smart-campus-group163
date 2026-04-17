package com.smartcampus.api.dto.user;

import com.smartcampus.api.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String email;
    private String name;
    private String pictureUrl;
    private Set<Role> roles;
    private Boolean enabled;
    private String studentRegistrationNumber;
    private String faculty;
    private String major;
    private String phoneNumber;
    private String employeeId;
    private String department;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLogin;
}
