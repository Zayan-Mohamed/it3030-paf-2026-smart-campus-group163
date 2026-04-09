package com.smartcampus.api.controller;

import com.smartcampus.api.dto.StudentDashboardResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for Student Dashboard operations.
 * 
 * SECURITY:
 * - All endpoints require authentication (JWT)
 * - Access restricted to users with STUDENT or ADMIN roles
 * - Uses @PreAuthorize for method-level security
 * 
 * Spring Security automatically adds "ROLE_" prefix to roles from the JWT.
 * So hasRole('STUDENT') checks for "ROLE_STUDENT" in the JWT.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/dashboard/student")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://localhost:5174"})
public class StudentDashboardController {
    
    /**
     * Get student dashboard welcome data.
     * 
     * SECURITY: Requires STUDENT or ADMIN role
     * 
     * @param userDetails The authenticated user's details (injected by Spring Security)
     * @return StudentDashboardResponse with welcome message and statistics
     */
    @GetMapping("/welcome")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentDashboardResponse> getWelcomeData(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Student dashboard welcome request from user: {}", userDetails.getUsername());
        
        // Placeholder response until dashboard services are wired in.
        StudentDashboardResponse response = StudentDashboardResponse.builder()
                .message("Welcome to your Student Dashboard!")
                .studentName(userDetails.getUsername())
                .activeBookings(0)
                .reportedIncidents(0)
                .availableFacilities(0)
                .build();
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get student's booking summary.
     * 
     * SECURITY: Requires STUDENT or ADMIN role
     * 
     * @param userDetails The authenticated user's details
     * @return Booking summary data
     */
    @GetMapping("/bookings/summary")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<String> getBookingsSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Bookings summary request from user: {}", userDetails.getUsername());
        
        // Placeholder response until booking services are wired in.
        return ResponseEntity.ok("Bookings summary for: " + userDetails.getUsername());
    }
    
    /**
     * Get student's incident summary.
     * 
     * SECURITY: Requires STUDENT or ADMIN role
     * 
     * @param userDetails The authenticated user's details
     * @return Incident summary data
     */
    @GetMapping("/incidents/summary")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<String> getIncidentsSummary(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        log.info("Incidents summary request from user: {}", userDetails.getUsername());
        
        // Placeholder response until incident services are wired in.
        return ResponseEntity.ok("Incidents summary for: " + userDetails.getUsername());
    }
}
