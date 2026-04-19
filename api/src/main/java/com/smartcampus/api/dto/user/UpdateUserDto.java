package com.smartcampus.api.dto.user;

import com.smartcampus.api.model.Role;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserDto {
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    private String pictureUrl;
    
    // Only Admin/Staff might be able to update these
    private Set<Role> roles;
    private Boolean enabled;
    private String studentRegistrationNumber;
    private String faculty;
    private String major;
    private String phoneNumber;
    private String employeeId;
    private String department;
}
