package com.smartcampus.api.dto.booking;

import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.Facility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private Long facilityId;
    private String facilityName;
    private Facility.FacilityType facilityType;
    private String facilityLocation;
    private Integer facilityCapacity;
    private Long userId;
    private String userName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer numberOfAttendees;
    private Booking.BookingStatus status;
    private String staffComments;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean canEdit;
    private boolean canDelete;
    private boolean canCancel;
}
