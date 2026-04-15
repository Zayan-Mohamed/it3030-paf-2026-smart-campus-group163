package com.smartcampus.api.service;

import com.smartcampus.api.dto.user.UpdateUserDto;
import com.smartcampus.api.dto.user.UserDto;
import com.smartcampus.api.dto.user.UserListDto;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Transactional(readOnly = true)
    public UserListDto getAllUsers(Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        
        List<UserDto> userDtos = userPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
                
        return UserListDto.builder()
                .users(userDtos)
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .currentPage(userPage.getNumber())
                .build();
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF') or @userService.isCurrentUser(#id)")
    @Transactional(readOnly = true)
    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return mapToDto(user);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF') or @userService.isCurrentUser(#id)")
    @Transactional
    public UserDto updateUser(Long id, UpdateUserDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdminOrStaff = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));

        if (updateDto.getName() != null) {
            user.setName(updateDto.getName());
        }
        
        if (updateDto.getStudentRegistrationNumber() != null) {
            String val = updateDto.getStudentRegistrationNumber().trim();
            user.setStudentRegistrationNumber(val.isEmpty() ? null : val);
        }
        if (updateDto.getFaculty() != null) {
            user.setFaculty(updateDto.getFaculty());
        }
        if (updateDto.getMajor() != null) {
            user.setMajor(updateDto.getMajor());
        }
        if (updateDto.getPhoneNumber() != null) {
            user.setPhoneNumber(updateDto.getPhoneNumber());
        }
        if (updateDto.getEmployeeId() != null) {
            String val = updateDto.getEmployeeId().trim();
            user.setEmployeeId(val.isEmpty() ? null : val);
        }
        if (updateDto.getDepartment() != null) {
            user.setDepartment(updateDto.getDepartment());
        }

        if (updateDto.getPictureUrl() != null) {
            user.setPictureUrl(updateDto.getPictureUrl());
        }

        // Only Admin or Staff can update roles or enabled status
        if (isAdminOrStaff) {
            if (updateDto.getRoles() != null) {
                user.setRoles(updateDto.getRoles());
            }
            if (updateDto.getEnabled() != null) {
                user.setEnabled(updateDto.getEnabled());
            }
        } else {
            // Check if student is trying to update protected fields
            if (updateDto.getRoles() != null || updateDto.getEnabled() != null) {
                throw new AccessDeniedException("Not authorized to update roles or enabled status");
            }
        }

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    @PreAuthorize("hasRole('ADMIN') or @userService.isCurrentUser(#id)")
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found with id: " + id);
        }
        userRepository.deleteById(id);
    }

    public boolean isCurrentUser(Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        String currentUserEmail;
        if (auth.getPrincipal() instanceof User) {
            currentUserEmail = ((User) auth.getPrincipal()).getEmail();
        } else {
            currentUserEmail = auth.getName();
        }
        return userRepository.findById(id)
                .map(user -> user.getEmail().equals(currentUserEmail))
                .orElse(false);
    }

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .pictureUrl(user.getPictureUrl())
                .roles(user.getRoles())
                .enabled(user.getEnabled())
                .studentRegistrationNumber(user.getStudentRegistrationNumber())
                .faculty(user.getFaculty())
                .major(user.getMajor())
                .phoneNumber(user.getPhoneNumber())
                .employeeId(user.getEmployeeId())
                .department(user.getDepartment())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
