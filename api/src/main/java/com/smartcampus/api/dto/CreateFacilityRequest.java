package com.smartcampus.api.dto;

import com.smartcampus.api.model.Facility;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateFacilityRequest {

    @NotBlank(message = "Facility name is required")
    private String name;

    private String description;

    @NotNull(message = "Facility type is required")
    private Facility.FacilityType facilityType;

    @NotBlank(message = "Facility location is required")
    private String location;

    @NotNull(message = "Facility capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Facility status is required")
    private Facility.FacilityStatus status;

    private String imageUrl;

    private List<Long> amenityIds;

    @NotNull(message = "Available from time is required")
    private LocalTime availableFrom;

    @NotNull(message = "Available to time is required")
    private LocalTime availableTo;
}
