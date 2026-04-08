package com.smartcampus.api.service;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.model.Notification;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing notifications.
 * Provides business logic for fetching and marking notifications as read.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    
    /**
     * Get top 20 unread notifications for a user.
     * 
     * @param user The authenticated user
     * @return List of unread notification DTOs
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(User user) {
        log.info("Fetching unread notifications for user: {}", user.getEmail());
        
        List<Notification> notifications = notificationRepository.findTop20UnreadByUserId(user.getId());
        
        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all notifications for a user.
     * 
     * @param user The authenticated user
     * @return List of all notification DTOs
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllNotifications(User user) {
        log.info("Fetching all notifications for user: {}", user.getEmail());
        
        List<Notification> notifications = notificationRepository.findAllByUserId(user.getId());
        
        return notifications.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    /**
     * Get unread notification count for a user.
     * 
     * @param user The authenticated user
     * @return Number of unread notifications
     */
    @Transactional(readOnly = true)
    public Long getUnreadCount(User user) {
        log.info("Fetching unread count for user: {}", user.getEmail());
        return notificationRepository.countUnreadByUserId(user.getId());
    }
    
    /**
     * Mark a notification as read.
     * 
     * @param notificationId The notification ID
     * @param user The authenticated user
     * @return Updated notification DTO
     * @throws IllegalArgumentException if notification not found or doesn't belong to user
     */
    @Transactional
    public NotificationDTO markAsRead(Long notificationId, User user) {
        log.info("Marking notification {} as read for user: {}", notificationId, user.getEmail());
        
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        
        // Verify notification belongs to the user
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Notification does not belong to user");
        }
        
        // Mark as read
        notification.setIsRead(true);
        Notification updated = notificationRepository.save(notification);
        
        log.info("Notification {} marked as read", notificationId);
        return convertToDTO(updated);
    }
    
    /**
     * Mark all notifications as read for a user.
     * 
     * @param user The authenticated user
     * @return Number of notifications marked as read
     */
    @Transactional
    public Long markAllAsRead(User user) {
        log.info("Marking all notifications as read for user: {}", user.getEmail());
        
        List<Notification> unreadNotifications = notificationRepository.findTop20UnreadByUserId(user.getId());
        
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
        
        log.info("Marked {} notifications as read", unreadNotifications.size());
        return (long) unreadNotifications.size();
    }
    
    /**
     * Convert Notification entity to DTO.
     * 
     * @param notification The notification entity
     * @return NotificationDTO
     */
    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .build();
    }
}
