package com.smartcampus.api.service;

import com.smartcampus.api.dto.CreateFacilityRequest;
import com.smartcampus.api.dto.FacilityResponse;
import com.smartcampus.api.dto.UpdateFacilityRequest;
import com.smartcampus.api.exception.DuplicateFacilityException;
import com.smartcampus.api.exception.FacilityNotFoundException;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;

    @Override
    public FacilityResponse create(CreateFacilityRequest request) {
        if (facilityRepository.existsByName(request.getName())) {
            throw new DuplicateFacilityException("Facility already exists with name: " + request.getName());
        }

        validateAvailability(request.getAvailableFrom(), request.getAvailableTo());

        Facility facility = Facility.builder()
                .name(request.getName())
                .description(request.getDescription())
                .facilityType(request.getFacilityType())
                .location(request.getLocation())
                .capacity(request.getCapacity())
                .status(request.getStatus())
                .imageUrl(request.getImageUrl())
                .amenities(request.getAmenities())
                .availableFrom(request.getAvailableFrom())
                .availableTo(request.getAvailableTo())
                .build();

        return mapToResponse(facilityRepository.save(facility));
    }

    @Override
    @Transactional(readOnly = true)
    public FacilityResponse getById(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));
        return mapToResponse(facility);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacilityResponse> getAll() {
        return facilityRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public FacilityResponse update(Long id, UpdateFacilityRequest request) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));

        if (request.getName() != null
                && !request.getName().equals(facility.getName())
                && facilityRepository.existsByName(request.getName())) {
            throw new DuplicateFacilityException("Facility already exists with name: " + request.getName());
        }

        if (request.getAvailableFrom() != null || request.getAvailableTo() != null) {
            LocalTime from = request.getAvailableFrom() != null ? request.getAvailableFrom() : facility.getAvailableFrom();
            LocalTime to = request.getAvailableTo() != null ? request.getAvailableTo() : facility.getAvailableTo();
            validateAvailability(from, to);
        }

        if (request.getName() != null) {
            facility.setName(request.getName());
        }
        if (request.getDescription() != null) {
            facility.setDescription(request.getDescription());
        }
        if (request.getFacilityType() != null) {
            facility.setFacilityType(request.getFacilityType());
        }
        if (request.getLocation() != null) {
            facility.setLocation(request.getLocation());
        }
        if (request.getCapacity() != null) {
            facility.setCapacity(request.getCapacity());
        }
        if (request.getStatus() != null) {
            facility.setStatus(request.getStatus());
        }
        if (request.getImageUrl() != null) {
            facility.setImageUrl(request.getImageUrl());
        }
        if (request.getAmenities() != null) {
            facility.setAmenities(request.getAmenities());
        }
        if (request.getAvailableFrom() != null) {
            facility.setAvailableFrom(request.getAvailableFrom());
        }
        if (request.getAvailableTo() != null) {
            facility.setAvailableTo(request.getAvailableTo());
        }

        return mapToResponse(facilityRepository.save(facility));
    }

    @Override
    public void delete(Long id) {
        Facility facility = facilityRepository.findById(id)
                .orElseThrow(() -> new FacilityNotFoundException("Facility not found with id: " + id));
        facilityRepository.delete(facility);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FacilityResponse> search(
            String name,
            String location,
            Facility.FacilityType facilityType,
            Facility.FacilityStatus status,
            Integer minCapacity
    ) {
        Specification<Facility> specification = Specification.where(null);

        if (name != null && !name.isBlank()) {
            String normalizedName = name.toLowerCase();
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + normalizedName + "%"));
        }

        if (location != null && !location.isBlank()) {
            String normalizedLocation = location.toLowerCase();
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("location")), "%" + normalizedLocation + "%"));
        }

        if (facilityType != null) {
            specification = specification.and((root, query, cb) ->
                    cb.equal(root.get("facilityType"), facilityType));
        }

        if (status != null) {
            specification = specification.and((root, query, cb) ->
                    cb.equal(root.get("status"), status));
        }

        if (minCapacity != null) {
            specification = specification.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
        }

        return facilityRepository.findAll(specification).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateAvailability(LocalTime from, LocalTime to) {
        if (from != null && to != null && !from.isBefore(to)) {
            throw new IllegalArgumentException("availableFrom must be before availableTo");
        }
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
                .availableFrom(facility.getAvailableFrom())
                .availableTo(facility.getAvailableTo())
                .createdAt(facility.getCreatedAt())
                .updatedAt(facility.getUpdatedAt())
                .build();
    }
}
