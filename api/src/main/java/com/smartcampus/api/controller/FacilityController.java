package com.smartcampus.api.controller;

import com.smartcampus.api.dto.booking.FacilityResponse;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.service.FacilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<FacilityResponse>> getFacilities(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Facility.FacilityType type,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) Facility.FacilityStatus status) {
        return ResponseEntity.ok(facilityService.getFacilities(search, location, type, minCapacity, status));
    }

    @GetMapping("/{facilityId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<FacilityResponse> getFacilityById(@PathVariable Long facilityId) {
        return ResponseEntity.ok(facilityService.getFacilityById(facilityId));
    }
}
