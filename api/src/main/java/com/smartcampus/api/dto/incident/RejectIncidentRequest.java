package com.smartcampus.api.dto.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RejectIncidentRequest {

    @NotBlank(message = "Rejection reason is required")
    @Size(max = 2000, message = "Rejection reason must not exceed 2000 characters")
    private String rejectionReason;
}