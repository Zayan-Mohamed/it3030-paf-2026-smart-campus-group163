package com.smartcampus.api.dto.incident;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignIncidentRequest {

    @NotNull(message = "Staff user ID is required")
    private Long staffUserId;
}