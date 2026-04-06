package com.smartcampus.api.service;

import com.smartcampus.api.dto.incident.CreateIncidentRequest;
import com.smartcampus.api.dto.incident.IncidentResponse;
import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.IncidentAttachment;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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
