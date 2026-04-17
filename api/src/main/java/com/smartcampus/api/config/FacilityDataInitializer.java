package com.smartcampus.api.config;

import com.smartcampus.api.model.Amenity;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.repository.AmenityRepository;
import com.smartcampus.api.repository.FacilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "test"})
public class FacilityDataInitializer {

    private final FacilityRepository facilityRepository;
    private final AmenityRepository amenityRepository;

    @Bean
    public CommandLineRunner initFacilities() {
        return args -> {
            if (facilityRepository.count() > 0) {
                log.info("Facilities already seeded");
                return;
            }

            Map<String, Amenity> amenities = seedAmenities(
                    "Projector",
                    "Air Conditioning",
                    "40 PCs",
                    "Whiteboard",
                    "Monitor",
                    "Power Outlets",
                    "Stage",
                    "PA System",
                    "Lighting",
                    "Workbenches",
                    "Soldering Stations",
                    "Storage",
                    "Video Conferencing"
            );

            List<Facility> facilities = List.of(
                    Facility.builder()
                            .name("Innovation Lab 01")
                            .description("Modern computer lab suitable for programming sessions and workshops.")
                            .facilityType(Facility.FacilityType.COMPUTER_LAB)
                            .location("Engineering Building - Floor 2")
                            .capacity(40)
                            .status(Facility.FacilityStatus.AVAILABLE)
                            .amenities(linkedAmenities(amenities, "Projector", "Air Conditioning", "40 PCs", "Whiteboard"))
                            .availableFrom(LocalTime.of(8, 0))
                            .availableTo(LocalTime.of(17, 0))
                            .build(),
                    Facility.builder()
                            .name("Study Room A")
                            .description("Quiet study room for group discussions and revision meetings.")
                            .facilityType(Facility.FacilityType.STUDY_ROOM)
                            .location("Library - Floor 3")
                            .capacity(8)
                            .status(Facility.FacilityStatus.AVAILABLE)
                            .amenities(linkedAmenities(amenities, "Whiteboard", "Monitor", "Power Outlets"))
                            .availableFrom(LocalTime.of(8, 0))
                            .availableTo(LocalTime.of(17, 0))
                            .build(),
                    Facility.builder()
                            .name("Main Auditorium")
                            .description("Large auditorium for seminars, guest lectures, and campus events.")
                            .facilityType(Facility.FacilityType.AUDITORIUM)
                            .location("Main Hall")
                            .capacity(250)
                            .status(Facility.FacilityStatus.AVAILABLE)
                            .amenities(linkedAmenities(amenities, "Stage", "PA System", "Projector", "Lighting"))
                            .availableFrom(LocalTime.of(8, 0))
                            .availableTo(LocalTime.of(17, 0))
                            .build(),
                    Facility.builder()
                            .name("Robotics Lab")
                            .description("Specialized lab equipped for electronics and robotics practical work.")
                            .facilityType(Facility.FacilityType.LABORATORY)
                            .location("Technology Block - Floor 1")
                            .capacity(24)
                            .status(Facility.FacilityStatus.AVAILABLE)
                            .amenities(linkedAmenities(amenities, "Workbenches", "Soldering Stations", "Storage"))
                            .availableFrom(LocalTime.of(8, 0))
                            .availableTo(LocalTime.of(17, 0))
                            .build(),
                    Facility.builder()
                            .name("Seminar Room B")
                            .description("Compact seminar room for presentations, meetings, and consultations.")
                            .facilityType(Facility.FacilityType.CONFERENCE_ROOM)
                            .location("Administration Building - Floor 1")
                            .capacity(20)
                            .status(Facility.FacilityStatus.AVAILABLE)
                            .amenities(linkedAmenities(amenities, "Projector", "Video Conferencing", "Whiteboard"))
                            .availableFrom(LocalTime.of(8, 0))
                            .availableTo(LocalTime.of(17, 0))
                            .build());

            facilityRepository.saveAll(facilities);
            log.info("Seeded {} facilities for booking module", facilities.size());
        };
    }

    private Map<String, Amenity> seedAmenities(String... names) {
        return java.util.Arrays.stream(names)
                .distinct()
                .map(name -> amenityRepository.findByName(name)
                        .orElseGet(() -> amenityRepository.save(Amenity.builder().name(name).build())))
                .collect(java.util.stream.Collectors.toMap(Amenity::getName, amenity -> amenity));
    }

    private Set<Amenity> linkedAmenities(Map<String, Amenity> amenities, String... names) {
        return java.util.Arrays.stream(names)
                .map(amenities::get)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }
}
