package com.smartcampus.api.service;

import com.smartcampus.api.dto.booking.BookingConflictResponse;
import com.smartcampus.api.dto.booking.AdminCancelBookingRequest;
import com.smartcampus.api.dto.booking.BookingResponse;
import com.smartcampus.api.dto.booking.CreateBookingRequest;
import com.smartcampus.api.dto.booking.ReviewBookingRequest;
import com.smartcampus.api.dto.booking.UpdateBookingRequest;
import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.BookingRepository;
import com.smartcampus.api.repository.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import com.smartcampus.api.event.BookingUpdatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final EnumSet<Booking.BookingStatus> ACTIVE_CONFLICT_STATUSES = EnumSet.of(
            Booking.BookingStatus.PENDING,
            Booking.BookingStatus.APPROVED);

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final FacilityService facilityService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<BookingResponse> getBookings(
            User currentUser,
            Booking.BookingStatus status,
            Long facilityId,
            LocalDateTime from,
            LocalDateTime to) {
        List<Booking> bookings = isPrivileged(currentUser)
                ? bookingRepository.findAllDetailed()
                : bookingRepository.findAllDetailedByUser(currentUser);

        return bookings.stream()
                .filter(booking -> status == null || booking.getStatus() == status)
                .filter(booking -> facilityId == null || booking.getFacility().getId().equals(facilityId))
                .filter(booking -> from == null || !booking.getStartTime().isBefore(from))
                .filter(booking -> to == null || !booking.getEndTime().isAfter(to))
                .map(booking -> mapToResponse(booking, currentUser))
                .toList();
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(User currentUser, Long bookingId) {
        Booking booking = getBookingEntity(bookingId);
        ensureCanView(currentUser, booking);
        return mapToResponse(booking, currentUser);
    }

    @Transactional
    public BookingResponse createBooking(User currentUser, CreateBookingRequest request) {
        Facility facility = facilityService.getFacilityEntity(request.getFacilityId());
        validateBookingRequest(facility, request.getStartTime(), request.getEndTime(), request.getNumberOfAttendees());
        ensureNoConflicts(facility.getId(), request.getStartTime(), request.getEndTime(), null);

        Booking booking = Booking.builder()
                .user(currentUser)
                .facility(facility)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose().trim())
                .numberOfAttendees(request.getNumberOfAttendees())
                .status(Booking.BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        String message = String.format("Your booking request for %s on %s has been created and is pending review.", 
            saved.getFacility().getName(), 
            saved.getStartTime().toLocalDate().toString());
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, saved, currentUser, "CREATED", message));
        return mapToResponse(saved, currentUser);
    }

    @Transactional
    public BookingResponse updateBooking(User currentUser, Long bookingId, UpdateBookingRequest request) {
        Booking booking = getBookingEntity(bookingId);
        ensureCanManage(currentUser, booking);

        if (!(booking.getStatus() == Booking.BookingStatus.PENDING || booking.getStatus() == Booking.BookingStatus.REJECTED)) {
            throw new IllegalArgumentException("Only pending or rejected bookings can be updated");
        }

        Facility facility = facilityService.getFacilityEntity(request.getFacilityId());
        validateBookingRequest(facility, request.getStartTime(), request.getEndTime(), request.getNumberOfAttendees());
        ensureNoConflicts(facility.getId(), request.getStartTime(), request.getEndTime(), booking.getId());

        booking.setFacility(facility);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose().trim());
        booking.setNumberOfAttendees(request.getNumberOfAttendees());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setStaffComments(null);
        booking.setReviewedAt(null);
        booking.setReviewedBy(null);

        Booking saved = bookingRepository.save(booking);
        String message = String.format("Your booking request for %s on %s has been updated.", 
            saved.getFacility().getName(), 
            saved.getStartTime().toLocalDate().toString());
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, saved, booking.getUser(), "UPDATED", message));
        return mapToResponse(saved, currentUser);
    }

    @Transactional
    public void deleteBooking(User currentUser, Long bookingId) {
        Booking booking = getBookingEntity(bookingId);
        ensureCanManage(currentUser, booking);

        if (booking.getStatus() == Booking.BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Approved bookings should be cancelled instead of deleted");
        }
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed bookings cannot be deleted");
        }

        bookingRepository.delete(booking);
        String message = String.format("Your booking request for %s on %s has been deleted.", 
            booking.getFacility().getName(), 
            booking.getStartTime().toLocalDate().toString());
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, booking, booking.getUser(), "DELETED", message));
    }

    @Transactional
    public BookingResponse cancelBooking(User currentUser, Long bookingId) {
        Booking booking = getBookingEntity(bookingId);
        ensureCanManage(currentUser, booking);

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed bookings cannot be cancelled");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);
        String message = String.format("Your booking request for %s on %s has been cancelled.", 
            saved.getFacility().getName(), 
            saved.getStartTime().toLocalDate().toString());
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, saved, booking.getUser(), "CANCELLED", message));
        return mapToResponse(saved, currentUser);
    }

    @Transactional
    public BookingResponse adminCancelBooking(User admin, Long bookingId, AdminCancelBookingRequest request) {
        Booking booking = getBookingEntity(bookingId);

        if (!admin.hasRole(Role.ADMIN)) {
            throw new IllegalArgumentException("Only admins can cancel approved bookings");
        }
        if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved bookings can be cancelled by admin");
        }
        if (booking.getReviewedAt() == null || booking.getReviewedAt().plusHours(2).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Approved bookings can only be cancelled within 2 hours of approval");
        }

        String reason = normalizeOptional(request.getReason());
        if (reason == null) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setAdminCancelReason(reason);
        booking.setStaffComments(reason);
        booking.setCancelledBy(admin);
        booking.setCancelledAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        String message = String.format("Your approved booking for %s on %s was cancelled by an admin. Reason: %s", 
            saved.getFacility().getName(), 
            saved.getStartTime().toLocalDate().toString(), 
            reason);
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, saved, booking.getUser(), "ADMIN_CANCELLED", message));
        return mapToResponse(saved, admin);
    }

    @Transactional
    public BookingResponse reviewBooking(User reviewer, Long bookingId, ReviewBookingRequest request) {
        Booking booking = getBookingEntity(bookingId);
        if (!isPrivileged(reviewer)) {
            throw new IllegalArgumentException("Only staff or admins can review bookings");
        }
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalArgumentException("Only pending bookings can be reviewed");
        }
        if (!(request.getStatus() == Booking.BookingStatus.APPROVED || request.getStatus() == Booking.BookingStatus.REJECTED)) {
            throw new IllegalArgumentException("Review status must be APPROVED or REJECTED");
        }
        if (request.getStatus() == Booking.BookingStatus.APPROVED) {
            validateBookingRequest(
                    booking.getFacility(),
                    booking.getStartTime(),
                    booking.getEndTime(),
                    booking.getNumberOfAttendees());
            ensureNoConflicts(booking.getFacility().getId(), booking.getStartTime(), booking.getEndTime(), booking.getId());
        }

        booking.setStatus(request.getStatus());
        booking.setStaffComments(normalizeOptional(request.getStaffComments()));
        booking.setReviewedBy(reviewer);
        booking.setReviewedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        String message = String.format("Your booking request for %s on %s has been %s.", 
            saved.getFacility().getName(), 
            saved.getStartTime().toLocalDate().toString(),
            request.getStatus().name().toLowerCase());
        eventPublisher.publishEvent(new BookingUpdatedEvent(this, saved, booking.getUser(), request.getStatus().name(), message));
        return mapToResponse(saved, reviewer);
    }

    @Transactional(readOnly = true)
    public BookingConflictResponse checkConflicts(
            User currentUser,
            Long facilityId,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Long excludeBookingId) {
        facilityService.getFacilityEntity(facilityId);
        validateTimeRange(startTime, endTime);

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facilityId,
                startTime,
                endTime,
                ACTIVE_CONFLICT_STATUSES,
                excludeBookingId);

        return BookingConflictResponse.builder()
                .hasConflict(!conflicts.isEmpty())
                .message(conflicts.isEmpty()
                        ? "No booking conflicts detected"
                        : "Selected time range overlaps with an existing booking")
                .conflictingBookings(conflicts.stream()
                        .map(booking -> BookingConflictResponse.ConflictBooking.builder()
                                .id(booking.getId())
                                .facilityName(booking.getFacility().getName())
                                .userName(canSeeOwnerName(currentUser) ? booking.getUser().getName() : "Another user")
                                .status(booking.getStatus())
                                .startTime(booking.getStartTime())
                                .endTime(booking.getEndTime())
                                .build())
                        .toList())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getCalendarBookings(User currentUser, Long facilityId, LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Calendar start and end dates are required");
        }
        if (!to.isAfter(from)) {
            throw new IllegalArgumentException("Calendar end date must be after the start date");
        }
        if (facilityId != null) {
            facilityService.getFacilityEntity(facilityId);
        }

        return bookingRepository.findCalendarBookings(facilityId, from, to).stream()
                .filter(booking -> isPrivileged(currentUser) || booking.getUser().getId().equals(currentUser.getId()))
                .map(booking -> mapToResponse(booking, currentUser))
                .toList();
    }

    private Booking getBookingEntity(Long bookingId) {
        return bookingRepository.findDetailedById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    private void validateBookingRequest(
            Facility facility,
            LocalDateTime startTime,
            LocalDateTime endTime,
            Integer numberOfAttendees) {
        validateTimeRange(startTime, endTime);

        if (facility.getStatus() != Facility.FacilityStatus.AVAILABLE) {
            throw new IllegalArgumentException("Selected facility is not currently available for booking");
        }
        if (numberOfAttendees > facility.getCapacity()) {
            throw new IllegalArgumentException("Expected attendees exceed the facility capacity");
        }
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Booking start and end times are required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("End time must be after the start time");
        }
    }

    private void ensureNoConflicts(Long facilityId, LocalDateTime startTime, LocalDateTime endTime, Long excludeBookingId) {
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                facilityId,
                startTime,
                endTime,
                ACTIVE_CONFLICT_STATUSES,
                excludeBookingId);

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException("Booking conflict detected for the selected facility and time range");
        }
    }

    private void ensureCanView(User currentUser, Booking booking) {
        if (!isPrivileged(currentUser) && !booking.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You do not have permission to view this booking");
        }
    }

    private void ensureCanManage(User currentUser, Booking booking) {
        if (!isPrivileged(currentUser) && !booking.getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You do not have permission to manage this booking");
        }
    }

    private boolean isPrivileged(User user) {
        return user.hasRole(Role.ADMIN) || user.hasRole(Role.STAFF);
    }

    private boolean canSeeOwnerName(User user) {
        return isPrivileged(user);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private BookingResponse mapToResponse(Booking booking, User currentUser) {
        boolean owner = booking.getUser().getId().equals(currentUser.getId());
        boolean privileged = isPrivileged(currentUser);
        boolean canManage = owner || privileged;
        boolean canEdit = canManage
                && (booking.getStatus() == Booking.BookingStatus.PENDING || booking.getStatus() == Booking.BookingStatus.REJECTED);
        boolean canDelete = canManage
                && booking.getStatus() != Booking.BookingStatus.APPROVED
                && booking.getStatus() != Booking.BookingStatus.COMPLETED;
        boolean canCancel = canManage
                && booking.getStatus() != Booking.BookingStatus.CANCELLED
                && booking.getStatus() != Booking.BookingStatus.COMPLETED;

        return BookingResponse.builder()
                .id(booking.getId())
                .facilityId(booking.getFacility().getId())
                .facilityName(booking.getFacility().getName())
                .facilityType(booking.getFacility().getFacilityType())
                .facilityLocation(booking.getFacility().getLocation())
                .facilityCapacity(booking.getFacility().getCapacity())
                .userId(booking.getUser().getId())
                .userName(privileged ? booking.getUser().getName() : currentUser.getName())
                .userEmail(resolveBookedUserEmail(booking, currentUser, privileged))
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .numberOfAttendees(booking.getNumberOfAttendees())
                .status(booking.getStatus())
                .staffComments(booking.getStaffComments())
                .reviewedByName(booking.getReviewedBy() != null ? booking.getReviewedBy().getName() : null)
                .reviewedAt(booking.getReviewedAt())
                .adminCancelReason(booking.getAdminCancelReason())
                .cancelledByName(booking.getCancelledBy() != null ? booking.getCancelledBy().getName() : null)
                .cancelledAt(booking.getCancelledAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .canEdit(canEdit)
                .canDelete(canDelete)
                .canCancel(canCancel)
                .build();
    }

    private String resolveBookedUserEmail(Booking booking, User currentUser, boolean privileged) {
        if (!privileged) {
            return currentUser.getEmail();
        }

        String mappedEmail = booking.getUser() != null ? normalizeOptional(booking.getUser().getEmail()) : null;
        if (mappedEmail != null) {
            return mappedEmail;
        }

        if (booking.getUser() == null || booking.getUser().getId() == null) {
            return null;
        }

        return userRepository.findById(booking.getUser().getId())
                .map(User::getEmail)
                .orElse(null);
    }
}
