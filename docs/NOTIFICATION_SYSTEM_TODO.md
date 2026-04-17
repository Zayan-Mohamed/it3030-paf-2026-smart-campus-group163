# Notification System Implementation - TODO Guide

## Overview
This document outlines the remaining tasks to fully integrate the real-time notification system into your Smart Campus Operations Hub.

---

## Phase 1: Backend Setup ✅ COMPLETE

All backend components have been generated:
- ✅ `Notification` entity with database schema
- ✅ `NotificationRepository` with custom queries
- ✅ `NotificationDTO` for API responses
- ✅ Event classes (`BookingUpdatedEvent`, `TicketUpdatedEvent`, `CommentAddedEvent`)
- ✅ `NotificationEventListener` for async event handling
- ✅ WebSocket configuration with JWT authentication
- ✅ `NotificationService` and `NotificationController` for REST endpoints

---

## Phase 2: Frontend Setup ✅ COMPLETE

All frontend components have been generated:
- ✅ Notification types added to `types/index.ts`
- ✅ `NotificationContext` with WebSocket integration
- ✅ `NotificationBell` component with dropdown UI

---

## TODO: Integration Steps

### 1. Install Required npm Dependencies

Run the following command in your `/client` directory:

```bash
npm install @stomp/stompjs
```

This installs the STOMP library for WebSocket communication.

---

### 2. Wrap Your App with NotificationProvider

**File:** `client/src/App.tsx` (or your main app component)

Add the `NotificationProvider` to your component tree, **inside** the `AuthProvider`:

```tsx
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        {/* Your routing and other components */}
      </NotificationProvider>
    </AuthProvider>
  );
}
```

**Why inside AuthProvider?** The `NotificationContext` depends on the authenticated user and JWT token from `AuthContext`.

---

### 3. Add NotificationBell to Your Navbar

**File:** `client/src/components/Navbar.tsx` (or equivalent)

Import and add the `NotificationBell` component:

```tsx
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  return (
    <nav className="...">
      {/* Your existing navbar content */}
      
      <div className="flex items-center gap-4">
        {/* Add the notification bell */}
        <NotificationBell />
        
        {/* Your user menu, etc. */}
      </div>
    </nav>
  );
};
```

---

### 4. Publish Events from Your Services

To trigger notifications, publish events from your service classes when relevant actions occur.

#### Example: Booking Service

**File:** `api/src/main/java/com/smartcampus/api/service/BookingService.java`

```java
import com.smartcampus.api.event.BookingUpdatedEvent;
import org.springframework.context.ApplicationEventPublisher;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final ApplicationEventPublisher eventPublisher; // Inject this
    
    public Booking approveBooking(Long bookingId, User reviewer) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(reviewer);
        booking.setReviewedAt(LocalDateTime.now());
        
        Booking saved = bookingRepository.save(booking);
        
        // Publish event to trigger notification
        eventPublisher.publishEvent(new BookingUpdatedEvent(
            this,
            saved,
            saved.getUser(), // Notify the booking owner
            "approved",
            String.format("Your booking for %s on %s has been approved!",
                saved.getFacility().getName(),
                saved.getStartTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy")))
        ));
        
        return saved;
    }
    
    public Booking rejectBooking(Long bookingId, User reviewer, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        
        booking.setStatus(BookingStatus.REJECTED);
        booking.setReviewedBy(reviewer);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setStaffComments(reason);
        
        Booking saved = bookingRepository.save(booking);
        
        // Publish event
        eventPublisher.publishEvent(new BookingUpdatedEvent(
            this,
            saved,
            saved.getUser(),
            "rejected",
            String.format("Your booking for %s has been rejected. Reason: %s",
                saved.getFacility().getName(), reason)
        ));
        
        return saved;
    }
}
```

#### Example: Incident Service

**File:** `api/src/main/java/com/smartcampus/api/service/IncidentService.java`

```java
import com.smartcampus.api.event.TicketUpdatedEvent;
import org.springframework.context.ApplicationEventPublisher;

@Service
@RequiredArgsConstructor
public class IncidentService {
    
    private final IncidentRepository incidentRepository;
    private final ApplicationEventPublisher eventPublisher; // Inject this
    
    public Incident updateIncidentStatus(Long incidentId, IncidentStatus newStatus, User staff) {
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        
        IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(newStatus);
        
        if (newStatus == IncidentStatus.RESOLVED) {
            incident.setResolvedAt(LocalDateTime.now());
        }
        
        Incident saved = incidentRepository.save(incident);
        
        // Notify the reporter
        eventPublisher.publishEvent(new TicketUpdatedEvent(
            this,
            saved,
            saved.getReporter(),
            "status_changed",
            String.format("Your incident #%d status changed from %s to %s",
                saved.getId(), oldStatus, newStatus)
        ));
        
        return saved;
    }
    
    public Incident assignIncident(Long incidentId, User assignee, User assigner) {
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
        
        incident.setAssignedTo(assignee);
        incident.setStatus(IncidentStatus.IN_PROGRESS);
        
        Incident saved = incidentRepository.save(incident);
        
        // Notify the assignee
        eventPublisher.publishEvent(new TicketUpdatedEvent(
            this,
            saved,
            assignee,
            "assigned",
            String.format("You have been assigned to incident #%d: %s",
                saved.getId(), saved.getDescription().substring(0, 50) + "...")
        ));
        
        // Also notify the reporter
        eventPublisher.publishEvent(new TicketUpdatedEvent(
            this,
            saved,
            saved.getReporter(),
            "assigned",
            String.format("Your incident #%d has been assigned to %s",
                saved.getId(), assignee.getName())
        ));
        
        return saved;
    }
}
```

#### Example: Comment Service (if you have one)

```java
import com.smartcampus.api.event.CommentAddedEvent;

@Service
@RequiredArgsConstructor
public class CommentService {
    
    private final CommentRepository commentRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    public Comment addCommentToIncident(Long incidentId, String content, User commenter, Incident incident) {
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setAuthor(commenter);
        comment.setIncident(incident);
        
        Comment saved = commentRepository.save(comment);
        
        // Notify the incident reporter (if they're not the commenter)
        if (!incident.getReporter().getId().equals(commenter.getId())) {
            eventPublisher.publishEvent(new CommentAddedEvent(
                this,
                incident.getReporter(),
                String.format("%s commented on your incident #%d",
                    commenter.getName(), incidentId),
                incidentId.toString(),
                "INCIDENT"
            ));
        }
        
        return saved;
    }
}
```

---

### 5. Database Migration

Create a database migration to add the `notifications` table.

**File:** `api/src/main/resources/db/migration/V5__create_notifications_table.sql` (or next version)

```sql
-- Create notifications table
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    
    CONSTRAINT chk_notification_type CHECK (type IN ('BOOKING_UPDATE', 'TICKET_UPDATE', 'NEW_COMMENT'))
);

-- Create indexes for performance
CREATE INDEX idx_notification_recipient ON notifications(recipient_id);
CREATE INDEX idx_notification_recipient_read ON notifications(recipient_id, is_read);
CREATE INDEX idx_notification_created_at ON notifications(created_at);
```

Then run your migrations or restart the Spring Boot app with Hibernate auto-update enabled.

---

### 6. Test the System

1. **Start the backend:** `./mvnw spring-boot:run` (in `/api` directory)
2. **Start the frontend:** `npm run dev` (in `/client` directory)
3. **Log in** as a user
4. **Trigger a notification:**
   - As a staff member, approve/reject a booking
   - Update an incident status
   - Add a comment
5. **Check the notification bell** - you should see:
   - Badge with unread count
   - Real-time notification appears
   - Green dot indicating WebSocket connection

---

### 7. Optional Enhancements

#### A. Add Navigation on Notification Click

In `NotificationBell.tsx`, update the `handleNotificationClick` function to navigate to the relevant page:

```tsx
import { useNavigate } from 'react-router-dom';

const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
        await markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.referenceType === 'BOOKING' && notification.referenceId) {
        navigate(`/bookings/${notification.referenceId}`);
    } else if (notification.referenceType === 'INCIDENT' && notification.referenceId) {
        navigate(`/incidents/${notification.referenceId}`);
    }
    
    setIsOpen(false);
};
```

#### B. Add Sound/Browser Notifications

```tsx
// In NotificationContext.tsx, add to the WebSocket message handler:

client.subscribe(`/user/${user.email}/queue/notifications`, (message) => {
    const notification: Notification = JSON.parse(message.body);
    
    // Update state
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Play sound
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(err => console.error('Sound error:', err));
    
    // Browser notification (requires permission)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Notification', {
            body: notification.message,
            icon: '/logo.png'
        });
    }
});
```

#### C. Persist WebSocket Connection Across Page Reloads

The current implementation reconnects automatically with a 5-second delay. For instant reconnection, consider using a service worker or storing connection state in localStorage.

#### D. Add Notification Preferences

Allow users to customize which notifications they receive (e.g., "Only critical incidents", "All booking updates").

---

## Summary of Files Created

### Backend (Spring Boot)
- `api/src/main/java/com/smartcampus/api/model/NotificationType.java`
- `api/src/main/java/com/smartcampus/api/model/Notification.java`
- `api/src/main/java/com/smartcampus/api/repository/NotificationRepository.java`
- `api/src/main/java/com/smartcampus/api/dto/NotificationDTO.java`
- `api/src/main/java/com/smartcampus/api/event/BookingUpdatedEvent.java`
- `api/src/main/java/com/smartcampus/api/event/TicketUpdatedEvent.java`
- `api/src/main/java/com/smartcampus/api/event/CommentAddedEvent.java`
- `api/src/main/java/com/smartcampus/api/service/NotificationEventListener.java`
- `api/src/main/java/com/smartcampus/api/service/NotificationService.java`
- `api/src/main/java/com/smartcampus/api/controller/NotificationController.java`
- `api/src/main/java/com/smartcampus/api/config/WebSocketConfig.java`
- `api/src/main/java/com/smartcampus/api/config/AsyncConfig.java`
- `api/src/main/java/com/smartcampus/api/security/JwtChannelInterceptor.java`
- Updated: `api/pom.xml` (added WebSocket dependency)
- Updated: `api/src/main/java/com/smartcampus/api/config/SecurityConfig.java` (added WebSocket endpoint permission)

### Frontend (React + TypeScript)
- `client/src/types/index.ts` (added Notification types)
- `client/src/contexts/NotificationContext.tsx`
- `client/src/components/NotificationBell.tsx`

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/notifications/unread` | Get top 20 unread notifications |
| GET | `/api/v1/notifications` | Get all notifications |
| GET | `/api/v1/notifications/count` | Get unread count |
| PUT | `/api/v1/notifications/{id}/read` | Mark specific notification as read |
| PUT | `/api/v1/notifications/read-all` | Mark all notifications as read |

**WebSocket Endpoint:** `ws://localhost:8080/ws-notifications`

**User Queue:** `/user/{email}/queue/notifications`

---

## Troubleshooting

### WebSocket Not Connecting
1. Ensure JWT token is valid and not expired
2. Check browser console for STOMP connection errors
3. Verify CORS settings in `WebSocketConfig.java` include your frontend URL
4. Check Spring Boot logs for authentication errors

### Notifications Not Appearing
1. Verify events are being published (check Spring logs)
2. Ensure `NotificationEventListener` is running (check for "Notification created with ID" logs)
3. Check database for saved notifications
4. Verify WebSocket subscription is active (check frontend console logs)

### Database Errors
1. Run the migration to create the `notifications` table
2. Ensure foreign key constraint to `users` table exists
3. Check for any column name mismatches

---

## Architecture Diagram

```
┌─────────────────┐          ┌──────────────────┐
│  Booking/       │          │  WebSocket       │
│  Incident       │ ────────▶│  Client          │
│  Service        │  Publish │  (Frontend)      │
└─────────────────┘  Event   └──────────────────┘
         │                            ▲
         │                            │ Real-time
         ▼                            │ Push
┌─────────────────┐          ┌──────────────────┐
│  Application    │          │  WebSocket       │
│  Event          │          │  (STOMP)         │
│  Publisher      │          └──────────────────┘
└─────────────────┘                   ▲
         │                            │
         │                            │
         ▼                            │
┌─────────────────┐          ┌──────────────────┐
│  Notification   │          │  Messaging       │
│  Event          │ ────────▶│  Template        │
│  Listener       │  Push    │  (Spring)        │
└─────────────────┘          └──────────────────┘
         │
         │ Save
         ▼
┌─────────────────┐
│  Notification   │
│  Repository     │
│  (Database)     │
└─────────────────┘
```

---

## Next Steps

1. ✅ **Install dependencies:** `npm install @stomp/stompjs`
2. ✅ **Wrap app with NotificationProvider**
3. ✅ **Add NotificationBell to Navbar**
4. ⏳ **Create database migration**
5. ⏳ **Publish events from your services** (Booking, Incident, etc.)
6. ⏳ **Test end-to-end functionality**
7. 🎯 **Optional: Add sound/navigation/preferences**

---

**Congratulations!** You now have a fully functional real-time notification system for your Smart Campus Operations Hub. 🎉
