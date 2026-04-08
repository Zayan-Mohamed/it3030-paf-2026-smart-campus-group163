package com.smartcampus.api.event;

import com.smartcampus.api.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring Application Event fired when a new comment is added to an entity.
 * This event decouples comment creation from notification logic.
 * 
 * Triggered when:
 * - A comment is added to a booking
 * - A comment is added to an incident
 * - Any stakeholder should be notified of the new comment
 */
@Getter
public class CommentAddedEvent extends ApplicationEvent {
    
    /**
     * The user who should receive the notification
     */
    private final User recipient;
    
    /**
     * The notification message
     */
    private final String message;
    
    /**
     * Reference ID (booking ID or incident ID)
     */
    private final String referenceId;
    
    /**
     * Reference type ("BOOKING" or "INCIDENT")
     */
    private final String referenceType;
    
    /**
     * Constructor for CommentAddedEvent
     * 
     * @param source The object that published the event (typically the service)
     * @param recipient The user to notify
     * @param message The notification message
     * @param referenceId The ID of the entity the comment was added to
     * @param referenceType The type of entity ("BOOKING" or "INCIDENT")
     */
    public CommentAddedEvent(Object source, User recipient, String message, String referenceId, String referenceType) {
        super(source);
        this.recipient = recipient;
        this.message = message;
        this.referenceId = referenceId;
        this.referenceType = referenceType;
    }
}
