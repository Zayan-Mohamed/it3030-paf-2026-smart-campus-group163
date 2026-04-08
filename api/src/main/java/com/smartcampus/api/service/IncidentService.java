package com.smartcampus.api.service;

import com.smartcampus.api.dto.incident.CreateIncidentRequest;
import com.smartcampus.api.dto.incident.IncidentResponse;
import com.smartcampus.api.event.TicketUpdatedEvent;
import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.IncidentAttachment;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.IncidentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp");

    private final IncidentRepository incidentRepository;
    private final SupabaseStorageService supabaseStorageService;
    private final ApplicationEventPublisher eventPublisher;
    private final UserRepository userRepository;

    /**
     * Creates a new incident and sends notifications to the reporter (confirmation)
     * and all staff/admin users (alert).
     * 
     * @param reporter User who is reporting the incident
     * @param request Incident details from the form
     * @param attachments Optional image attachments (up to 3)
     * @return Created incident response
     */
    public IncidentResponse createIncident(User reporter, CreateIncidentRequest request,
            List<MultipartFile> attachments) {
        List<MultipartFile> safeAttachments = attachments == null ? Collections.emptyList()
                : attachments.stream()
                        .filter(file -> file != null && !file.isEmpty())
                        .toList();

        validateAttachments(safeAttachments);

        List<IncidentAttachment> uploadedAttachments = safeAttachments.stream()
                .map(file -> supabaseStorageService.uploadIncidentImage(file, reporter.getId()))
                .toList();

        Incident incident = Incident.builder()
                .resourceLocation(request.getResourceLocation().trim())
                .category(request.getCategory())
                .description(request.getDescription().trim())
                .priority(request.getPriority())
                .preferredContact(request.getPreferredContact().trim())
                .status(Incident.IncidentStatus.OPEN)
                .reporter(reporter)
                .attachments(uploadedAttachments)
                .build();

        Incident saved = incidentRepository.save(incident);
        log.info("Incident created with ID: {}", saved.getId());

        // Send confirmation notification to the reporter
        String reporterMessage = String.format(
                "Your incident #%d has been submitted successfully. Location: %s",
                saved.getId(),
                saved.getResourceLocation()
        );

        eventPublisher.publishEvent(new TicketUpdatedEvent(
                this,
                saved,
                reporter,
                "created",
                reporterMessage
        ));

        // Send alert notification to all staff and admins
        List<User> staffAndAdmins = userRepository.findAllStaffAndAdmins();
        log.info("Notifying {} staff/admin users about new incident", staffAndAdmins.size());
        
        String staffMessage = String.format(
                "New %s incident #%d reported by %s at %s",
                saved.getPriority(),
                saved.getId(),
                reporter.getName(),
                saved.getResourceLocation()
        );

        for (User staff : staffAndAdmins) {
            eventPublisher.publishEvent(new TicketUpdatedEvent(
                    this,
                    saved,
                    staff,
                    "new_incident",
                    staffMessage
            ));
        }

        return mapToResponse(saved);
    }

    public List<IncidentResponse> getCurrentUserIncidents(User reporter) {
        return incidentRepository.findByReporterOrderByCreatedAtDesc(reporter)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Updates the status of an incident and publishes a notification event.
     * Example method to demonstrate event publishing for incident status changes.
     * 
     * @param incidentId ID of the incident to update
     * @param newStatus New status to set
     * @param staffUser Staff member performing the update
     * @return Updated incident response
     */
    public IncidentResponse updateIncidentStatus(Long incidentId, Incident.IncidentStatus newStatus, User staffUser) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));

        Incident.IncidentStatus oldStatus = incident.getStatus();
        incident.setStatus(newStatus);
        
        if (newStatus == Incident.IncidentStatus.RESOLVED) {
            incident.setResolvedAt(java.time.LocalDateTime.now());
        }
        
        Incident updated = incidentRepository.save(incident);

        // Publish event to trigger notification
        if (oldStatus != newStatus) {
            String message = String.format("Your incident #%d status changed from %s to %s", 
                    incident.getId(), oldStatus, newStatus);
            
            eventPublisher.publishEvent(new TicketUpdatedEvent(
                    this,
                    updated,
                    incident.getReporter(),
                    "status_changed",
                    message
            ));
        }

        return mapToResponse(updated);
    }

    /**
     * Assigns an incident to a staff member and publishes a notification event.
     * Example method to demonstrate event publishing for incident assignments.
     * 
     * @param incidentId ID of the incident to assign
     * @param staffMember Staff member to assign
     * @param assignedBy User performing the assignment
     * @return Updated incident response
     */
    public IncidentResponse assignIncident(Long incidentId, User staffMember, User assignedBy) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));

        incident.setAssignedTo(staffMember);
        incident.setStatus(Incident.IncidentStatus.IN_PROGRESS);
        
        Incident updated = incidentRepository.save(incident);

        // Publish event to trigger notification to the reporter
        String reporterMessage = String.format("Your incident #%d has been assigned to %s", 
                incident.getId(), staffMember.getName());
        
        eventPublisher.publishEvent(new TicketUpdatedEvent(
                this,
                updated,
                incident.getReporter(),
                "assigned",
                reporterMessage
        ));

        // Publish event to trigger notification to the assigned staff
        String staffMessage = String.format("You have been assigned to incident #%d: %s", 
                incident.getId(), incident.getDescription().substring(0, Math.min(50, incident.getDescription().length())));
        
        eventPublisher.publishEvent(new TicketUpdatedEvent(
                this,
                updated,
                staffMember,
                "assigned",
                staffMessage
        ));

        return mapToResponse(updated);
    }

    private void validateAttachments(List<MultipartFile> attachments) {
        if (attachments.size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("You can upload up to 3 images only");
        }

        for (MultipartFile file : attachments) {
            String contentType = file.getContentType();
            if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
                throw new IllegalArgumentException("Only JPEG, PNG, and WEBP images are allowed");
            }
            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                throw new IllegalArgumentException("Each image must be 5MB or smaller");
            }
        }
    }

    private IncidentResponse mapToResponse(Incident incident) {
        List<IncidentAttachment> attachments = incident.getAttachments() == null
                ? Collections.emptyList()
                : incident.getAttachments();

        return IncidentResponse.builder()
                .id(incident.getId())
                .resourceLocation(incident.getResourceLocation())
                .category(incident.getCategory())
                .description(incident.getDescription())
                .priority(incident.getPriority())
                .preferredContact(incident.getPreferredContact())
                .status(incident.getStatus())
                .imageUrls(attachments.stream().map(IncidentAttachment::getPublicUrl)
                        .collect(Collectors.toList()))
                .createdAt(incident.getCreatedAt())
                .build();
    }
}
