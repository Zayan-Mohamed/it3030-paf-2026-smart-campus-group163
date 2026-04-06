package com.smartcampus.api.dto.incident;

import com.smartcampus.api.model.Incident;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateIncidentRequest {

    @NotBlank(message = "Resource/location is required")
    @Size(max = 255, message = "Resource/location must not exceed 255 characters")
    private String resourceLocation;

    @NotNull(message = "Category is required")
    private Incident.IncidentCategory category;

    @NotBlank(message = "Description is required")
    @Size(max = 3000, message = "Description must not exceed 3000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private Incident.IncidentPriority priority;

    @NotBlank(message = "Preferred contact is required")
    @Size(max = 255, message = "Preferred contact must not exceed 255 characters")
    private String preferredContact;
}
