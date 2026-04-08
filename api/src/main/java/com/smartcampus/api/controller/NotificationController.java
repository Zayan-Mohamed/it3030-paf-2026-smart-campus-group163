package com.smartcampus.api.controller;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for notification operations.
 * Provides endpoints for fetching notifications and marking them as read.
 * 
 * All endpoints require authentication (JWT).
 */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {
    
    private final NotificationService notificationService;
    
    /**
     * Get unread notifications for the authenticated user.
     * Returns top 20 unread notifications ordered by creation time.
     * 
     * @param user The authenticated user (injected from JWT)
     * @return List of unread notifications
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(
            @AuthenticationPrincipal User user) {
        log.info("GET /api/v1/notifications/unread - User: {}", user.getEmail());
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user));
    }
    
    /**
     * Get all notifications for the authenticated user.
     * 
     * @param user The authenticated user (injected from JWT)
     * @return List of all notifications
     */
    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications(
            @AuthenticationPrincipal User user) {
        log.info("GET /api/v1/notifications - User: {}", user.getEmail());
        return ResponseEntity.ok(notificationService.getAllNotifications(user));
    }
    
    /**
     * Get unread notification count for the authenticated user.
     * Used to display the badge count in the notification bell.
     * 
     * @param user The authenticated user (injected from JWT)
     * @return Map with "count" key
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @AuthenticationPrincipal User user) {
        log.info("GET /api/v1/notifications/count - User: {}", user.getEmail());
        Long count = notificationService.getUnreadCount(user);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    /**
     * Mark a specific notification as read.
     * 
     * @param id The notification ID
     * @param user The authenticated user (injected from JWT)
     * @return Updated notification DTO
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        log.info("PUT /api/v1/notifications/{}/read - User: {}", id, user.getEmail());
        return ResponseEntity.ok(notificationService.markAsRead(id, user));
    }
    
    /**
     * Mark all notifications as read for the authenticated user.
     * 
     * @param user The authenticated user (injected from JWT)
     * @return Map with "markedCount" key indicating number of notifications marked as read
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Long>> markAllAsRead(
            @AuthenticationPrincipal User user) {
        log.info("PUT /api/v1/notifications/read-all - User: {}", user.getEmail());
        Long count = notificationService.markAllAsRead(user);
        return ResponseEntity.ok(Map.of("markedCount", count));
    }
}
