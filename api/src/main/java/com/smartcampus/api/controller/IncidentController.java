package com.smartcampus.api.controller;

import com.smartcampus.api.dto.incident.CreateIncidentRequest;
import com.smartcampus.api.dto.incident.IncidentResponse;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/incidents")
@RequiredArgsConstructor
@Validated
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentResponse> createIncident(
            @AuthenticationPrincipal User user,
            @Valid @ModelAttribute CreateIncidentRequest request,
            @RequestPart(value = "attachments", required = false) List<MultipartFile> attachments) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(incidentService.createIncident(user, request, attachments));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IncidentResponse>> getMyIncidents(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(incidentService.getCurrentUserIncidents(user));
    }
}
