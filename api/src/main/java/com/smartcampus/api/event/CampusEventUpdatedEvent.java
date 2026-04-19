package com.smartcampus.api.event;

import com.smartcampus.api.model.CampusEvent;
import com.smartcampus.api.model.User;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Spring Application Event fired when a campus event or its squads are updated.
 * This event decouples campus event updates from notification logic.
 */
@Getter
public class CampusEventUpdatedEvent extends ApplicationEvent {
    
    private final CampusEvent event;
    private final User recipient;
    private final String action;
    private final String message;
    
    public CampusEventUpdatedEvent(Object source, CampusEvent event, User recipient, String action, String message) {
        super(source);
        this.event = event;
        this.recipient = recipient;
        this.action = action;
        this.message = message;
    }
}
