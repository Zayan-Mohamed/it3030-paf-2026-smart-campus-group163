package com.smartcampus.api.dto;

import com.smartcampus.api.model.Facility;
import jakarta.validation.constraints.Min;
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
public class UpdateFacilityRequest {

    private String name;

    private String description;

    private Facility.FacilityType facilityType;

    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private Facility.FacilityStatus status;

    private String imageUrl;

    private List<Long> amenityIds;

    private LocalTime availableFrom;

    private LocalTime availableTo;
}
