package com.smartcampus.api.repository;

import com.smartcampus.api.model.Facility;
import com.smartcampus.api.model.Facility.FacilityStatus;
import com.smartcampus.api.model.Facility.FacilityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Facility entity operations.
 */
@Repository
public interface FacilityRepository extends JpaRepository<Facility, Long>, JpaSpecificationExecutor<Facility> {

    /**
     * Find facility by name
     */
    Optional<Facility> findByName(String name);

    /**
     * Find facilities by status
     */
    List<Facility> findByStatus(FacilityStatus status);

    /**
     * Find facilities by location
     */
    List<Facility> findByLocation(String location);

    /**
     * Find facilities by type and status
     */
    List<Facility> findByFacilityTypeAndStatus(FacilityType facilityType, FacilityStatus status);

    /**
     * Find facilities by name containing (case-insensitive)
     */
    List<Facility> findByNameContainingIgnoreCase(String name);

    /**
     * Check if facility exists by name
     */
    boolean existsByName(String name);
}
