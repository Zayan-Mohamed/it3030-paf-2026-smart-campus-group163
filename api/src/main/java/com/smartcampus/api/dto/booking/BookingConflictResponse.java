package com.smartcampus.api.dto.booking;

import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.Facility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingConflictResponse {

    private boolean hasConflict;
    private String message;
    private List<ConflictBooking> conflictingBookings;
    private List<AlternativeTimeSlot> alternativeTimeSlots;
    private List<AlternativeFacility> alternativeFacilities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConflictBooking {
        private Long id;
        private String facilityName;
        private String userName;
        private Booking.BookingStatus status;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeTimeSlot {
        private LocalDateTime startTime;
        private LocalDateTime endTime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeFacility {
        private Long id;
        private String name;
        private Facility.FacilityStatus status;
        private String location;
        private String facilityType;
        private Integer capacity;
    }
}
