package com.smartcampus.api.controller;

import com.smartcampus.api.dto.booking.BookingConflictResponse;
import com.smartcampus.api.dto.booking.BookingResponse;
import com.smartcampus.api.dto.booking.CreateBookingRequest;
import com.smartcampus.api.dto.booking.ReviewBookingRequest;
import com.smartcampus.api.dto.booking.UpdateBookingRequest;
import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Booking.BookingStatus status,
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.getBookings(user, status, facilityId, from, to));
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> getBookingById(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.getBookingById(user, bookingId));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateBookingRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.createBooking(user, request));
    }

    @PutMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> updateBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody UpdateBookingRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.updateBooking(user, bookingId, request));
    }

    @DeleteMapping("/{bookingId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        bookingService.deleteBooking(user, bookingId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bookingId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.cancelBooking(user, bookingId));
    }

    @PostMapping("/{bookingId}/review")
    @PreAuthorize("hasAnyRole('STAFF', 'ADMIN')")
    public ResponseEntity<BookingResponse> reviewBooking(
            @AuthenticationPrincipal User user,
            @PathVariable Long bookingId,
            @Valid @RequestBody ReviewBookingRequest request) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.reviewBooking(user, bookingId, request));
    }

    @GetMapping("/calendar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<BookingResponse>> getCalendarBookings(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) Long facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.getCalendarBookings(user, facilityId, from, to));
    }

    @GetMapping("/conflicts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingConflictResponse> checkConflicts(
            @AuthenticationPrincipal User user,
            @RequestParam Long facilityId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) Long excludeBookingId) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(bookingService.checkConflicts(user, facilityId, startTime, endTime, excludeBookingId));
    }
}
