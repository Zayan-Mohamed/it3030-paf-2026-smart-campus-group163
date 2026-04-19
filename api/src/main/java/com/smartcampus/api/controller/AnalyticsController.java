package com.smartcampus.api.controller;

import com.smartcampus.api.dto.analytics.AnalyticsResponse;
import com.smartcampus.api.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnalyticsResponse> getAnalytics(
            @RequestParam(required = false, defaultValue = "6M") String timeRange) {
        return ResponseEntity.ok(analyticsService.getAnalytics(timeRange));
    }
}
