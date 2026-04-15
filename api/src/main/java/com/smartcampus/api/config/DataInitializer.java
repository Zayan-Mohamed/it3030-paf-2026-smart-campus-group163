package com.smartcampus.api.config;

import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

/**
 * Initializes test users with different roles for RBAC testing.
 * 
 * SECURITY: Only active in 'dev' and 'test' profiles
 * Uses environment variables for credentials
 * MUST be disabled in production
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "test"})
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.init.admin-password:change-me-admin}")
    private String adminPassword;

    @Value("${app.init.staff-password:change-me-staff}")
    private String staffPassword;

    @Value("${app.init.student-password:change-me-student}")
    private String studentPassword;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            log.info("Starting data initialization (dev/test mode only)...");

            // Create ADMIN user
            if (!userRepository.existsByEmail("admin@smartcampus.edu")) {
                User admin = User.builder()
                        .email("admin@smartcampus.edu")
                        .name("Super Admin")
                        .password(passwordEncoder.encode(adminPassword))
                        .pictureUrl("https://ui-avatars.com/api/?name=Super+Admin&background=dc2626&color=fff")
                        .roles(Set.of(Role.ADMIN))
                        .enabled(true)
                        .employeeId("EMP-ADMIN-" + System.currentTimeMillis())
                        .department("IT Services")
                        .phoneNumber("+1234567890")
                        .build();
                userRepository.save(admin);
                log.info("Created ADMIN user");
            } else {
                log.info("ADMIN user already exists");
            }

            // Create STAFF user
            if (!userRepository.existsByEmail("staff@smartcampus.edu")) {
                User staff = User.builder()
                        .email("staff@smartcampus.edu")
                        .name("Staff Member")
                        .password(passwordEncoder.encode(staffPassword))
                        .pictureUrl("https://ui-avatars.com/api/?name=Staff+Member&background=2563eb&color=fff")
                        .roles(Set.of(Role.STAFF))
                        .enabled(true)
                        .employeeId("EMP-STAFF-" + System.currentTimeMillis())
                        .department("Facility Management")
                        .phoneNumber("+1234567890")
                        .build();
                userRepository.save(staff);
                log.info("Created STAFF user");
            } else {
                log.info("STAFF user already exists");
            }

            // Create STUDENT user
            if (!userRepository.existsByEmail("student@smartcampus.edu")) {
                User student = User.builder()
                        .email("student@smartcampus.edu")
                        .name("Test Student")
                        .password(passwordEncoder.encode(studentPassword))
                        .pictureUrl("https://ui-avatars.com/api/?name=Test+Student&background=16a34a&color=fff")
                        .roles(Set.of(Role.STUDENT))
                        .enabled(true)
                        .studentRegistrationNumber(java.util.UUID.randomUUID().toString())
                        .faculty("Engineering")
                        .major("Software Engineering")
                        .phoneNumber("+1234567890")
                        .build();
                userRepository.save(student);
                log.info("Created STUDENT user");
            } else {
                log.info("STUDENT user already exists");
            }

            log.info("Data initialization complete!");
        };
    }
}
