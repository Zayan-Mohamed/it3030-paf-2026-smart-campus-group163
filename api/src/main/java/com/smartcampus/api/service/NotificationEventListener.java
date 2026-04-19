package com.smartcampus.api.service;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.event.BookingUpdatedEvent;
import com.smartcampus.api.event.CampusEventUpdatedEvent;
import com.smartcampus.api.event.CommentAddedEvent;
import com.smartcampus.api.event.TicketUpdatedEvent;
import com.smartcampus.api.model.Notification;
import com.smartcampus.api.model.NotificationType;
import com.smartcampus.api.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationEventListener {
    
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * Handle BookingUpdatedEvent by creating and saving a notification.
     * Runs asynchronously to avoid blocking the main business logic.
     * 
     * @param event The booking updated event
     */
    @EventListener
    @Async
    @Transactional
    public void handleBookingUpdatedEvent(BookingUpdatedEvent event) {
        try {
            log.info("Handling BookingUpdatedEvent for booking ID: {} and recipient: {}", 
                    event.getBooking().getId(), event.getRecipient().getEmail());
            
            // Create and save notification
            Notification notification = Notification.builder()
                    .recipient(event.getRecipient())
                    .message(event.getMessage())
                    .type(NotificationType.BOOKING_UPDATE)
                    .isRead(false)
                    .referenceId(event.getBooking().getId().toString())
                    .referenceType("BOOKING")
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification created with ID: {}", savedNotification.getId());
            
            // Convert to DTO for WebSocket
            NotificationDTO notificationDTO = convertToDTO(savedNotification);
            
            // Push to WebSocket - send to specific user's queue
            String userEmail = event.getRecipient().getEmail();
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/notifications",
                    notificationDTO
            );
            log.info("Notification pushed to WebSocket for user: {}", userEmail);
            
        } catch (Exception e) {
            log.error("Error handling BookingUpdatedEvent for booking ID: {}", 
                    event.getBooking().getId(), e);
        }
    }
    
    /**
     * Handle TicketUpdatedEvent by creating and saving a notification.
     * Runs asynchronously to avoid blocking the main business logic.
     * 
     * @param event The ticket updated event
     */
    @EventListener
    @Async
    @Transactional
    public void handleTicketUpdatedEvent(TicketUpdatedEvent event) {
        try {
            log.info("Handling TicketUpdatedEvent for incident ID: {} and recipient: {}", 
                    event.getIncident().getId(), event.getRecipient().getEmail());
            
            // Create and save notification
            Notification notification = Notification.builder()
                    .recipient(event.getRecipient())
                    .message(event.getMessage())
                    .type(NotificationType.TICKET_UPDATE)
                    .isRead(false)
                    .referenceId(event.getIncident().getId().toString())
                    .referenceType("INCIDENT")
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification created with ID: {}", savedNotification.getId());
            
            // Convert to DTO for WebSocket
            NotificationDTO notificationDTO = convertToDTO(savedNotification);
            
            // Push to WebSocket - send to specific user's queue
            String userEmail = event.getRecipient().getEmail();
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/notifications",
                    notificationDTO
            );
            log.info("Notification pushed to WebSocket for user: {}", userEmail);
            
        } catch (Exception e) {
            log.error("Error handling TicketUpdatedEvent for incident ID: {}", 
                    event.getIncident().getId(), e);
        }
    }
    
    /**
     * Handle CommentAddedEvent by creating and saving a notification.
     * Runs asynchronously to avoid blocking the main business logic.
     * 
     * @param event The comment added event
     */
    @EventListener
    @Async
    @Transactional
    public void handleCommentAddedEvent(CommentAddedEvent event) {
        try {
            log.info("Handling CommentAddedEvent for {} ID: {} and recipient: {}", 
                    event.getReferenceType(), event.getReferenceId(), event.getRecipient().getEmail());
            
            // Create and save notification
            Notification notification = Notification.builder()
                    .recipient(event.getRecipient())
                    .message(event.getMessage())
                    .type(NotificationType.NEW_COMMENT)
                    .isRead(false)
                    .referenceId(event.getReferenceId())
                    .referenceType(event.getReferenceType())
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification created with ID: {}", savedNotification.getId());
            
            // Convert to DTO for WebSocket
            NotificationDTO notificationDTO = convertToDTO(savedNotification);
            
            // Push to WebSocket - send to specific user's queue
            String userEmail = event.getRecipient().getEmail();
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/notifications",
                    notificationDTO
            );
            log.info("Notification pushed to WebSocket for user: {}", userEmail);
            
        } catch (Exception e) {
            log.error("Error handling CommentAddedEvent for {} ID: {}", 
                    event.getReferenceType(), event.getReferenceId(), e);
        }
    }
    
    /**
     * Convert Notification entity to DTO for API/WebSocket transmission
     * 
     * @param notification The notification entity
     * @return NotificationDTO
     */
    /**
     * Handle CampusEventUpdatedEvent by creating and saving a notification.
     * Runs asynchronously to avoid blocking the main business logic.
     * 
     * @param event The campus event updated event
     */
    @EventListener
    @Async
    @Transactional
    public void handleCampusEventUpdatedEvent(CampusEventUpdatedEvent event) {
        try {
            log.info("Handling CampusEventUpdatedEvent for event ID: {} and recipient: {}", 
                    event.getEvent().getId(), event.getRecipient().getEmail());
            
            // Create and save notification
            Notification notification = Notification.builder()
                    .recipient(event.getRecipient())
                    .message(event.getMessage())
                    .type(NotificationType.CAMPUS_EVENT_UPDATE)
                    .isRead(false)
                    .referenceId(event.getEvent().getId().toString())
                    .referenceType("CAMPUS_EVENT")
                    .build();
            
            Notification savedNotification = notificationRepository.save(notification);
            log.info("Notification created with ID: {}", savedNotification.getId());
            
            // Convert to DTO for WebSocket
            NotificationDTO notificationDTO = convertToDTO(savedNotification);
            
            // Push to WebSocket - send to specific user's queue
            String userEmail = event.getRecipient().getEmail();
            messagingTemplate.convertAndSendToUser(
                    userEmail,
                    "/queue/notifications",
                    notificationDTO
            );
            log.info("Notification pushed to WebSocket for user: {}", userEmail);
            
        } catch (Exception e) {
            log.error("Error handling CampusEventUpdatedEvent for event ID: {}", 
                    event.getEvent().getId(), e);
        }
    }

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
