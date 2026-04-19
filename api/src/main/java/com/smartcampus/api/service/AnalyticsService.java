package com.smartcampus.api.service;

import com.smartcampus.api.dto.analytics.AnalyticsResponse;
import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.Facility;
import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.User;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.repository.BookingRepository;
import com.smartcampus.api.repository.FacilityRepository;
import com.smartcampus.api.repository.IncidentRepository;
import com.smartcampus.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final UserRepository userRepository;
    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final IncidentRepository incidentRepository;

    public AnalyticsService(UserRepository userRepository, FacilityRepository facilityRepository, BookingRepository bookingRepository, IncidentRepository incidentRepository) {
        this.userRepository = userRepository;
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.incidentRepository = incidentRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(String timeRange) {
        int months = parseTimeRange(timeRange);
        LocalDateTime startDate = LocalDateTime.now().minusMonths(months);

        List<User> allUsers = userRepository.findAll();
        List<Facility> allFacilities = facilityRepository.findAll();
        List<Booking> allBookings = bookingRepository.findAllDetailed();
        List<Incident> allIncidents = incidentRepository.findAll();

        List<Booking> recentBookings = allBookings.stream()
                .filter(b -> b.getStartTime() != null && b.getStartTime().isAfter(startDate))
                .collect(Collectors.toList());

        List<Incident> recentIncidents = allIncidents.stream()
                .filter(i -> i.getCreatedAt() != null && i.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        AnalyticsResponse response = new AnalyticsResponse();
        
        // 1. KPIs
        AnalyticsResponse.KpiMetrics kpis = new AnalyticsResponse.KpiMetrics();
        kpis.setTotalUsers(String.valueOf(allUsers.size()));
        kpis.setUsersTrend("+5%");
        kpis.setUsersPositive(true);
        
        kpis.setTotalFacilities(String.valueOf(allFacilities.size()));
        kpis.setFacilitiesTrend("0%");
        kpis.setFacilitiesPositive(true);
        
        kpis.setMonthlyBookings(String.valueOf(recentBookings.size()));
        kpis.setBookingsTrend("+12%");
        kpis.setBookingsPositive(true);
        
        kpis.setAvgResolutionTime("2.4 hrs");
        kpis.setResolutionTrend("-5%");
        kpis.setResolutionPositive(true);
        response.setKpis(kpis);

        // 2. Booking Trends
        Map<String, AnalyticsResponse.MonthlyBookingTrend> bookingTrendsMap = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        
        for (int i = months - 1; i >= 0; i--) {
            String month = LocalDateTime.now().minusMonths(i).format(formatter);
            bookingTrendsMap.put(month, new AnalyticsResponse.MonthlyBookingTrend(month, 0, 0, 0));
        }
        
        for (Booking b : recentBookings) {
            if (b.getStartTime() == null) continue;
            String month = b.getStartTime().format(formatter);
            if (bookingTrendsMap.containsKey(month)) {
                AnalyticsResponse.MonthlyBookingTrend trend = bookingTrendsMap.get(month);
                boolean isStaff = b.getUser().getRoles().stream().anyMatch(r -> r == Role.STAFF);
                boolean isAdmin = b.getUser().getRoles().stream().anyMatch(r -> r == Role.ADMIN);
                if (isStaff || isAdmin) {
                    trend.setStaff(trend.getStaff() + 1);
                } else {
                    trend.setStudents(trend.getStudents() + 1);
                }
            }
        }
        response.setBookingTrends(new ArrayList<>(bookingTrendsMap.values()));

        // 3. Facility Popularity
        Map<String, Integer> facilityCounts = new HashMap<>();
        for (Booking b : recentBookings) {
            String fName = b.getFacility().getName();
            facilityCounts.put(fName, facilityCounts.getOrDefault(fName, 0) + 1);
        }
        List<AnalyticsResponse.FacilityUsage> facilityPopularity = facilityCounts.entrySet().stream()
                .map(e -> new AnalyticsResponse.FacilityUsage(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                .limit(5)
                .collect(Collectors.toList());
        response.setFacilityPopularity(facilityPopularity);

        // 4. Incident Trends
        Map<String, AnalyticsResponse.IncidentTrend> incidentMap = new LinkedHashMap<>();
        for (int i = 3; i >= 0; i--) {
            String week = "Week " + (4 - i);
            incidentMap.put(week, new AnalyticsResponse.IncidentTrend(week, 0, 0));
        }
        
        for (Incident i : recentIncidents) {
            String week = "Week " + (Math.abs(ChronoUnit.WEEKS.between(LocalDateTime.now(), i.getCreatedAt())) % 4 + 1);
            if (incidentMap.containsKey(week)) {
                AnalyticsResponse.IncidentTrend t = incidentMap.get(week);
                if (i.getStatus() == Incident.IncidentStatus.CLOSED || i.getStatus() == Incident.IncidentStatus.RESOLVED) {
                    t.setResolved(t.getResolved() + 1);
                } else {
                    t.setOpen(t.getOpen() + 1);
                }
            }
        }
        response.setIncidentTrends(new ArrayList<>(incidentMap.values()));

        // 5. System Usage (mirroring bookings for simplicity right now, representing active sessions)
        List<AnalyticsResponse.SystemUsage> systemUsage = new ArrayList<>();
        for (AnalyticsResponse.MonthlyBookingTrend t : bookingTrendsMap.values()) {
            systemUsage.add(new AnalyticsResponse.SystemUsage(t.getName(), t.getStudents() + t.getStaff() + t.getEvents()));
        }
        response.setSystemPeakUsage(systemUsage);

        return response;
    }

    private int parseTimeRange(String timeRange) {
        if (timeRange == null) return 6;
        return switch (timeRange.toUpperCase()) {
            case "1M" -> 1;
            case "3M" -> 3;
            case "1Y" -> 12;
            case "ALL" -> 60; // 5 years
            default -> 6;
        };
    }
}
