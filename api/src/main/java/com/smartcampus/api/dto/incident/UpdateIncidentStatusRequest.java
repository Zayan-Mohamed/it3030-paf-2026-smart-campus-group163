package com.smartcampus.api.dto.incident;

import com.smartcampus.api.model.Incident;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateIncidentStatusRequest {

    @NotNull(message = "Status is required")
    private Incident.IncidentStatus status;

    @Size(max = 2000, message = "Resolution notes must not exceed 2000 characters")
    private String resolutionNotes;
}