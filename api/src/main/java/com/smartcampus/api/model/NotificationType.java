package com.smartcampus.api.model;

/**
 * Enum representing different types of notifications in the system.
 * Used to categorize and potentially filter notifications by type.
 */
public enum NotificationType {
    /**
     * Notification related to booking updates (created, confirmed, cancelled)
     */
    BOOKING_UPDATE,
    
    /**
     * Notification related to incident/ticket updates (status changes, assignments)
     */
    TICKET_UPDATE,
    
    /**
     * Notification for new comments on incidents or bookings
     */
    NEW_COMMENT
}
