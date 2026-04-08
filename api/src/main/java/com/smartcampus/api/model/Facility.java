package com.smartcampus.api.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "facilities", indexes = {
        @Index(name = "idx_facilities_facility_type", columnList = "facility_type"),
        @Index(name = "idx_facilities_status", columnList = "status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Facility name is required")
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Facility type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type", nullable = false)
    private FacilityType facilityType;

    @NotBlank(message = "Facility location is required")
    @Column(nullable = false)
    private String location;

    @NotNull(message = "Facility capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(nullable = false)
    private Integer capacity;

    @NotNull(message = "Facility status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private FacilityStatus status = FacilityStatus.AVAILABLE;

    @Column(name = "image_url")
    private String imageUrl;

    private String amenities;

    @NotNull(message = "Available from time is required")
    @Column(name = "available_from", nullable = false)
    private LocalTime availableFrom;

    @NotNull(message = "Available to time is required")
    @Column(name = "available_to", nullable = false)
    private LocalTime availableTo;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum FacilityType {
        CONFERENCE_ROOM,
        LABORATORY,
        SPORTS_HALL,
        AUDITORIUM,
        STUDY_ROOM,
        COMPUTER_LAB,
        PROJECTOR,
        CAMERA,
        MEETING_ROOM,
        LECTURE_HALL,
        OTHER
    }

    public enum FacilityStatus {
        AVAILABLE,
        UNDER_MAINTENANCE,
        UNAVAILABLE,
        ACTIVE,
        OUT_OF_SERVICE
    }
}
