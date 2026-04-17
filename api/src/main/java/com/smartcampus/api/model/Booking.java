package com.smartcampus.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Booking entity representing facility reservations by users.
 */
@Entity
@Table(name = "bookings", indexes = {
    @Index(name = "idx_booking_user", columnList = "user_id"),
    @Index(name = "idx_booking_facility", columnList = "facility_id"),
    @Index(name = "idx_booking_status", columnList = "status"),
    @Index(name = "idx_booking_start_time", columnList = "start_time")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    /**
     * User who made the booking
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;
    
    /**
     * Facility being booked
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    @NotNull(message = "Facility is required")
    private Facility facility;
    
    /**
     * Start time of the booking
     */
    @Column(name = "start_time", nullable = false)
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;
    
    /**
     * End time of the booking
     */
    @Column(name = "end_time", nullable = false)
    @NotNull(message = "End time is required")
    private LocalDateTime endTime;
    
    /**
     * Purpose of the booking
     */
    @Column(columnDefinition = "TEXT")
    private String purpose;
    
    /**
     * Number of attendees
     */
    @Column(name = "number_of_attendees")
    private Integer numberOfAttendees;
    
    /**
     * Status of the booking
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;
    
    /**
     * Comments from staff (approval/rejection reason)
     */
    @Column(columnDefinition = "TEXT")
    private String staffComments;
    
    /**
     * Staff member who approved/rejected
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;
    
    /**
     * Timestamp when booking was reviewed
     */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    /**
     * Reason provided when an approved booking is cancelled by an admin
     */
    @Column(name = "admin_cancel_reason", columnDefinition = "TEXT")
    private String adminCancelReason;

    /**
     * Admin user who cancelled the booking
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private User cancelledBy;

    /**
     * Timestamp when the booking was cancelled by admin
     */
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    /**
     * Status of a booking
     */
    public enum BookingStatus {
        PENDING,
        APPROVED,
        REJECTED,
        CANCELLED,
        COMPLETED
    }
}
