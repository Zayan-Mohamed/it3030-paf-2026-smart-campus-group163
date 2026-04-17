package com.smartcampus.api.event;

import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring Application Event fired when a booking is updated.
 * This event decouples booking updates from notification logic.
 * 
 * Triggered when:
 * - Booking is approved
 * - Booking is rejected
 * - Booking is cancelled
 * - Booking status changes
 */
@Getter
public class BookingUpdatedEvent extends ApplicationEvent {
    
    /**
     * The booking that was updated
     */
    private final Booking booking;
    
    /**
     * The user who should receive the notification (typically the booking owner)
     */
    private final User recipient;
    
    /**
     * The action that occurred (e.g., "approved", "rejected", "cancelled")
     */
    private final String action;
    
    /**
     * Additional message details for the notification
     */
    private final String message;
    
    /**
     * Constructor for BookingUpdatedEvent
     * 
     * @param source The object that published the event (typically the service)
     * @param booking The booking that was updated
     * @param recipient The user to notify
     * @param action The action that occurred
     * @param message The notification message
     */
    public BookingUpdatedEvent(Object source, Booking booking, User recipient, String action, String message) {
        super(source);
        this.booking = booking;
        this.recipient = recipient;
        this.action = action;
        this.message = message;
    }
}
