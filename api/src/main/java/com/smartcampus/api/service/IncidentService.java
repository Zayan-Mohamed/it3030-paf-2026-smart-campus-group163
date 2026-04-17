package com.smartcampus.api.service;

import com.smartcampus.api.dto.incident.AssignIncidentRequest;
import com.smartcampus.api.dto.incident.CreateIncidentRequest;
import com.smartcampus.api.dto.incident.IncidentAssigneeResponse;
import com.smartcampus.api.dto.incident.IncidentResponse;
import com.smartcampus.api.dto.incident.RejectIncidentRequest;
import com.smartcampus.api.dto.incident.UpdateIncidentStatusRequest;
import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.IncidentAttachment;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.IncidentRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private static final int MAX_ATTACHMENTS = 3;
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/webp");

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final SupabaseStorageService supabaseStorageService;

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
        return mapToResponse(saved);
    }

    public List<IncidentResponse> getCurrentUserIncidents(User reporter) {
        return incidentRepository.findByReporterOrderByCreatedAtDesc(reporter)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<IncidentResponse> getIncidentQueue(User currentUser) {
        List<Incident> incidents = currentUser.hasRole(Role.ADMIN)
                ? incidentRepository.findAllByOrderByCreatedAtDesc()
                : incidentRepository.findByAssignedToOrderByCreatedAtDesc(currentUser);

        return incidents.stream().map(this::mapToResponse).toList();
    }

    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<IncidentAssigneeResponse> getAssignableStaffMembers() {
        return userRepository.findAll()
                .stream()
                .filter(user -> user.hasRole(Role.STAFF))
                .map(user -> IncidentAssigneeResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    public IncidentResponse assignIncident(Long incidentId, AssignIncidentRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));

        User assignee = userRepository.findById(request.getStaffUserId())
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found"));

        if (!assignee.hasRole(Role.STAFF)) {
            throw new IllegalArgumentException("Selected user is not a staff member");
        }

        incident.setAssignedTo(assignee);
        Incident saved = incidentRepository.save(incident);
        return mapToResponse(saved);
    }

    public IncidentResponse updateIncidentStatus(User currentUser, Long incidentId, UpdateIncidentStatusRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));

        boolean isAdmin = currentUser.hasRole(Role.ADMIN);
        if (!isAdmin) {
            Long assignedToId = incident.getAssignedTo() != null ? incident.getAssignedTo().getId() : null;
            if (assignedToId == null || !assignedToId.equals(currentUser.getId())) {
                throw new AccessDeniedException("Only assigned staff can update this incident");
            }
        }

        Incident.IncidentStatus currentStatus = incident.getStatus();
        Incident.IncidentStatus nextStatus = request.getStatus();

        validateStatusTransition(currentStatus, nextStatus);

        String resolutionNotes = request.getResolutionNotes() == null ? null : request.getResolutionNotes().trim();
        if (nextStatus == Incident.IncidentStatus.RESOLVED && (resolutionNotes == null || resolutionNotes.isEmpty())) {
            throw new IllegalArgumentException("Resolution notes are required when marking an incident as RESOLVED");
        }

        if (incident.getAssignedTo() == null && !isAdmin) {
            incident.setAssignedTo(currentUser);
        }

        incident.setStatus(nextStatus);
        incident.setRejectionReason(null);

        if (resolutionNotes != null && !resolutionNotes.isEmpty()) {
            incident.setResolutionNotes(resolutionNotes);
        }

        if (nextStatus == Incident.IncidentStatus.RESOLVED && incident.getResolvedAt() == null) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        if (nextStatus == Incident.IncidentStatus.CLOSED && incident.getResolvedAt() == null) {
            incident.setResolvedAt(LocalDateTime.now());
        }

        Incident saved = incidentRepository.save(incident);
        return mapToResponse(saved);
    }

    public IncidentResponse rejectIncident(Long incidentId, RejectIncidentRequest request) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found"));

        if (incident.getStatus() == Incident.IncidentStatus.CLOSED) {
            throw new IllegalArgumentException("Closed incidents cannot be rejected");
        }

        incident.setStatus(Incident.IncidentStatus.CANCELLED);
        incident.setRejectionReason(request.getRejectionReason().trim());

        Incident saved = incidentRepository.save(incident);
        return mapToResponse(saved);
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

    private void validateStatusTransition(Incident.IncidentStatus currentStatus, Incident.IncidentStatus nextStatus) {
        if (currentStatus == nextStatus) {
            return;
        }

        if (currentStatus == Incident.IncidentStatus.CANCELLED || currentStatus == Incident.IncidentStatus.CLOSED) {
            throw new IllegalArgumentException("This incident can no longer transition to another status");
        }

        boolean allowed = switch (currentStatus) {
            case OPEN -> nextStatus == Incident.IncidentStatus.IN_PROGRESS;
            case IN_PROGRESS -> nextStatus == Incident.IncidentStatus.RESOLVED;
            case RESOLVED -> nextStatus == Incident.IncidentStatus.CLOSED;
            default -> false;
        };

        if (!allowed) {
            throw new IllegalArgumentException("Invalid incident status transition");
        }
    }

    private IncidentResponse mapToResponse(Incident incident) {
        List<IncidentAttachment> attachments = incident.getAttachments() == null
                ? Collections.emptyList()
                : incident.getAttachments();

        User reporter = incident.getReporter();
        User assignedTo = incident.getAssignedTo();

        return IncidentResponse.builder()
                .id(incident.getId())
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getName() : null)
                .resourceLocation(incident.getResourceLocation())
                .category(incident.getCategory())
                .description(incident.getDescription())
                .priority(incident.getPriority())
                .preferredContact(incident.getPreferredContact())
                .status(incident.getStatus())
                .assignedToId(assignedTo != null ? assignedTo.getId() : null)
                .assignedToName(assignedTo != null ? assignedTo.getName() : null)
                .resolutionNotes(incident.getResolutionNotes())
                .rejectionReason(incident.getRejectionReason())
                .imageUrls(attachments.stream().map(IncidentAttachment::getPublicUrl)
                        .collect(Collectors.toList()))
                .resolvedAt(incident.getResolvedAt())
                .createdAt(incident.getCreatedAt())
                .updatedAt(incident.getUpdatedAt())
                .build();
    }
}
