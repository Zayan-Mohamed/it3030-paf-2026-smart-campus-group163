package com.smartcampus.api.service;

import com.smartcampus.api.dto.CreateFacilityRequest;
import com.smartcampus.api.dto.FacilityResponse;
import com.smartcampus.api.dto.UpdateFacilityRequest;
import com.smartcampus.api.model.Facility;

import java.util.List;

public interface FacilityService {

    FacilityResponse create(CreateFacilityRequest request);

    FacilityResponse getById(Long id);

    List<FacilityResponse> getAll();

    FacilityResponse update(Long id, UpdateFacilityRequest request);

    void delete(Long id);

    List<FacilityResponse> search(
            String name,
            String location,
            Facility.FacilityType facilityType,
            Facility.FacilityStatus status,
            Integer minCapacity
    );
}
