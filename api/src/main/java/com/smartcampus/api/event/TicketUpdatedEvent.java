package com.smartcampus.api.event;

import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring Application Event fired when an incident (ticket) is updated.
 * This event decouples incident updates from notification logic.
 * 
 * Triggered when:
 * - Incident status changes (OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED)
 * - Incident is assigned to a staff member
 * - Incident priority is updated
 * - Comments are added to the incident
 */
@Getter
public class TicketUpdatedEvent extends ApplicationEvent {
    
    /**
     * The incident/ticket that was updated
     */
    private final Incident incident;
    
    /**
     * The user who should receive the notification
     */
    private final User recipient;
    
    /**
     * The action that occurred (e.g., "status_changed", "assigned", "commented")
     */
    private final String action;
    
    /**
     * Additional message details for the notification
     */
    private final String message;
    
    /**
     * Constructor for TicketUpdatedEvent
     * 
     * @param source The object that published the event (typically the service)
     * @param incident The incident that was updated
     * @param recipient The user to notify
     * @param action The action that occurred
     * @param message The notification message
     */
    public TicketUpdatedEvent(Object source, Incident incident, User recipient, String action, String message) {
        super(source);
        this.incident = incident;
        this.recipient = recipient;
        this.action = action;
        this.message = message;
    }
}
