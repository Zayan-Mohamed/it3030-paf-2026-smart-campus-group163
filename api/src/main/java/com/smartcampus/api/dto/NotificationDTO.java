package com.smartcampus.api.dto;

import com.smartcampus.api.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for Notification entity.
 * Used to send notification data to the frontend via REST API and WebSocket.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    
    /**
     * Notification ID
     */
    private Long id;
    
    /**
     * Notification message content
     */
    private String message;
    
    /**
     * Type of notification (BOOKING_UPDATE, TICKET_UPDATE, NEW_COMMENT)
     */
    private NotificationType type;
    
    /**
     * Whether the notification has been read
     */
    private Boolean isRead;
    
    /**
     * Timestamp when notification was created
     */
    private LocalDateTime createdAt;
    
    /**
     * Optional reference to the related entity ID
     */
    private String referenceId;
    
    /**
     * Optional reference type (e.g., "BOOKING", "INCIDENT")
     */
    private String referenceType;
}
