package com.smartcampus.api.dto;

import com.smartcampus.api.model.Facility;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacilityResponse {

    private Long id;

    private String name;

    private String description;

    private Facility.FacilityType facilityType;

    private String location;

    private Integer capacity;

    private Facility.FacilityStatus status;

    private String imageUrl;

    private String amenities;

    private LocalTime availableFrom;

    private LocalTime availableTo;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
