package com.smartcampus.api.dto.booking;

import com.smartcampus.api.model.Booking;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewBookingRequest {

    @NotNull(message = "Review status is required")
    private Booking.BookingStatus status;

    private String staffComments;
}
