package com.smartcampus.api.service;

import com.smartcampus.api.dto.booking.FacilityResponse;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class FacilityService {

    private final FacilityRepository facilityRepository;

    public List<FacilityResponse> getFacilities(
            String search,
            String location,
            Facility.FacilityType type,
            Integer minCapacity,
            Facility.FacilityStatus status) {
        return facilityRepository.findAll().stream()
                .filter(facility -> matchesSearch(facility, search))
                .filter(facility -> matchesLocation(facility, location))
                .filter(facility -> type == null || facility.getFacilityType() == type)
                .filter(facility -> minCapacity == null || facility.getCapacity() >= minCapacity)
                .filter(facility -> status == null || facility.getStatus() == status)
                .sorted((left, right) -> left.getName().compareToIgnoreCase(right.getName()))
                .map(this::mapToResponse)
                .toList();
    }

    public Facility getFacilityEntity(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new IllegalArgumentException("Facility not found"));
    }

    public FacilityResponse getFacilityById(Long facilityId) {
        return mapToResponse(getFacilityEntity(facilityId));
    }

    private boolean matchesSearch(Facility facility, String search) {
        if (search == null || search.isBlank()) {
            return true;
        }

        String normalized = search.toLowerCase(Locale.ROOT).trim();
        return facility.getName().toLowerCase(Locale.ROOT).contains(normalized)
                || facility.getLocation().toLowerCase(Locale.ROOT).contains(normalized)
                || (facility.getDescription() != null
                && facility.getDescription().toLowerCase(Locale.ROOT).contains(normalized));
    }

    private boolean matchesLocation(Facility facility, String location) {
        if (location == null || location.isBlank()) {
            return true;
        }
        return facility.getLocation().toLowerCase(Locale.ROOT)
                .contains(location.toLowerCase(Locale.ROOT).trim());
    }

    private FacilityResponse mapToResponse(Facility facility) {
        return FacilityResponse.builder()
                .id(facility.getId())
                .name(facility.getName())
                .description(facility.getDescription())
                .facilityType(facility.getFacilityType())
                .location(facility.getLocation())
                .capacity(facility.getCapacity())
                .status(facility.getStatus())
                .imageUrl(facility.getImageUrl())
                .amenities(facility.getAmenities())
                .build();
    }
}
