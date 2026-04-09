package com.smartcampus.api.controller;

import com.smartcampus.api.dto.CreateFacilityRequest;
import com.smartcampus.api.dto.FacilityResponse;
import com.smartcampus.api.dto.UpdateFacilityRequest;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.service.FacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@RequiredArgsConstructor
public class FacilityController {

    private final FacilityService facilityService;

    @PostMapping
    public ResponseEntity<FacilityResponse> create(@Valid @RequestBody CreateFacilityRequest request) {
        FacilityResponse response = facilityService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<FacilityResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(facilityService.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<FacilityResponse>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Facility.FacilityType facilityType,
            @RequestParam(required = false) Facility.FacilityStatus status,
            @RequestParam(required = false) Integer minCapacity
    ) {
        if (name == null && location == null && facilityType == null && status == null && minCapacity == null) {
            return ResponseEntity.ok(facilityService.getAll());
        }

        return ResponseEntity.ok(facilityService.search(name, location, facilityType, status, minCapacity));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacilityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFacilityRequest request
    ) {
        return ResponseEntity.ok(facilityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        facilityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
