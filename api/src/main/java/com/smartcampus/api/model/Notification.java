package com.smartcampus.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Notification entity representing real-time notifications sent to users.
 * Notifications are triggered by events in the system (bookings, incidents, comments).
 */
@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_recipient", columnList = "recipient_id"),
    @Index(name = "idx_notification_recipient_read", columnList = "recipient_id, is_read"),
    @Index(name = "idx_notification_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * The user who should receive this notification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    @NotNull(message = "Recipient is required")
    private User recipient;
    
    /**
     * The notification message content
     */
    @Column(nullable = false, length = 500)
    @NotBlank(message = "Message is required")
    private String message;
    
    /**
     * The type of notification (BOOKING_UPDATE, TICKET_UPDATE, NEW_COMMENT)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @NotNull(message = "Type is required")
    private NotificationType type;
    
    /**
     * Whether the notification has been read by the recipient
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;
    
    /**
     * Timestamp when the notification was created
     */
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Optional reference to the related entity (booking ID, incident ID, etc.)
     * Stored as a string to support multiple entity types
     */
    @Column(name = "reference_id")
    private String referenceId;
    
    /**
     * Optional reference type to identify what kind of entity this refers to
     */
    @Column(name = "reference_type", length = 50)
    private String referenceType;
}
