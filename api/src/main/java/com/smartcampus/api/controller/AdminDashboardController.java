package com.smartcampus.api.controller;

import com.smartcampus.api.dto.AdminDashboardResponse;
import com.smartcampus.api.model.Incident.IncidentStatus;
import com.smartcampus.api.repository.BookingRepository;
import com.smartcampus.api.repository.FacilityRepository;
import com.smartcampus.api.repository.IncidentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Admin Dashboard operations.
 * 
 * SECURITY:
 * - All endpoints require authentication (JWT)
 * - Access restricted to users with ADMIN role ONLY
 * - Uses @PreAuthorize for method-level security
 * 
 * Spring Security automatically adds "ROLE_" prefix to roles from the JWT.
 * So hasRole('ADMIN') checks for "ROLE_ADMIN" in the JWT.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174"})
public class AdminDashboardController {
    
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final IncidentRepository incidentRepository;
    private final FacilityRepository facilityRepository;
    
    /**
     * Get admin dashboard welcome data.
     * 
     * SECURITY: Requires ADMIN role ONLY
     * 
     * @param userDetails The authenticated user's details (injected by Spring Security)
     * @return AdminDashboardResponse with welcome message and system statistics
     */
    @GetMapping("/welcome")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getWelcomeData(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Admin dashboard welcome request from user: {}", userDetails.getUsername());
        
        long totalUsers = userRepository.count();
        long activeBookings = bookingRepository.count(); // Represents total or active bookings depending on logic
        long openIncidents = incidentRepository.countByStatus(IncidentStatus.OPEN);
        long totalFacilities = facilityRepository.count();
        
        AdminDashboardResponse response = AdminDashboardResponse.builder()
                .message("Welcome Admin!")
                .adminName(userDetails.getUsername())
                .totalUsers((int) totalUsers)
                .activeBookings((int) activeBookings)
                .openIncidents((int) openIncidents)
                .totalFacilities((int) totalFacilities)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get system-wide statistics.
     * 
     * SECURITY: Requires ADMIN role ONLY
     * 
     * @param userDetails The authenticated user's details
     * @return System statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getSystemStatistics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("System statistics request from admin: {}", userDetails.getUsername());
        
        // Placeholder response until statistics services are wired in.
        return ResponseEntity.ok("System statistics - accessible only to admins");
    }
    
    /**
     * Get all users in the system (admin function).
     * 
     * SECURITY: Requires ADMIN role ONLY
     * 
     * @param userDetails The authenticated user's details
     * @return List of all users
     */
    @GetMapping("/users/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getAllUsers(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Get all users request from admin: {}", userDetails.getUsername());
        
        // Placeholder response until user administration services are wired in.
        return ResponseEntity.ok("All users - admin access only");
    }
    
    /**
     * Get system audit logs (admin function).
     * 
     * SECURITY: Requires ADMIN role ONLY
     * 
     * @param userDetails The authenticated user's details
     * @return System audit logs
     */
    @GetMapping("/audit/logs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> getAuditLogs(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Audit logs request from admin: {}", userDetails.getUsername());
        
        // Placeholder response until audit services are wired in.
        return ResponseEntity.ok("Audit logs - admin access only");
    }
}
