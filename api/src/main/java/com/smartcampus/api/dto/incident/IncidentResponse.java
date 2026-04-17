package com.smartcampus.api.dto.incident;

import com.smartcampus.api.model.Incident;
import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class IncidentResponse {
    Long id;
    Long reporterId;
    String reporterName;
    String resourceLocation;
    Incident.IncidentCategory category;
    String description;
    Incident.IncidentPriority priority;
    String preferredContact;
    Incident.IncidentStatus status;
    Long assignedToId;
    String assignedToName;
    String resolutionNotes;
    String rejectionReason;
    List<String> imageUrls;
    LocalDateTime resolvedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
