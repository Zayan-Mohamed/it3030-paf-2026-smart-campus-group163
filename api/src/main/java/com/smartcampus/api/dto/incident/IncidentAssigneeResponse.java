package com.smartcampus.api.dto.incident;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class IncidentAssigneeResponse {
    Long id;
    String name;
    String email;
}