package com.smartcampus.api.dto.analytics;

import java.util.List;

public class AnalyticsResponse {

    private KpiMetrics kpis;
    private List<MonthlyBookingTrend> bookingTrends;
    private List<FacilityUsage> facilityPopularity;
    private List<IncidentTrend> incidentTrends;
    private List<SystemUsage> systemPeakUsage;

    public AnalyticsResponse() {
    }

    public AnalyticsResponse(KpiMetrics kpis, List<MonthlyBookingTrend> bookingTrends, List<FacilityUsage> facilityPopularity, List<IncidentTrend> incidentTrends, List<SystemUsage> systemPeakUsage) {
        this.kpis = kpis;
        this.bookingTrends = bookingTrends;
        this.facilityPopularity = facilityPopularity;
        this.incidentTrends = incidentTrends;
        this.systemPeakUsage = systemPeakUsage;
    }

    public KpiMetrics getKpis() { return kpis; }
    public void setKpis(KpiMetrics kpis) { this.kpis = kpis; }

    public List<MonthlyBookingTrend> getBookingTrends() { return bookingTrends; }
    public void setBookingTrends(List<MonthlyBookingTrend> bookingTrends) { this.bookingTrends = bookingTrends; }

    public List<FacilityUsage> getFacilityPopularity() { return facilityPopularity; }
    public void setFacilityPopularity(List<FacilityUsage> facilityPopularity) { this.facilityPopularity = facilityPopularity; }

    public List<IncidentTrend> getIncidentTrends() { return incidentTrends; }
    public void setIncidentTrends(List<IncidentTrend> incidentTrends) { this.incidentTrends = incidentTrends; }

    public List<SystemUsage> getSystemPeakUsage() { return systemPeakUsage; }
    public void setSystemPeakUsage(List<SystemUsage> systemPeakUsage) { this.systemPeakUsage = systemPeakUsage; }

    public static class KpiMetrics {
        private String totalUsers;
        private String usersTrend;
        private boolean usersPositive;

        private String totalFacilities;
        private String facilitiesTrend;
        private boolean facilitiesPositive;

        private String monthlyBookings;
        private String bookingsTrend;
        private boolean bookingsPositive;

        private String avgResolutionTime;
        private String resolutionTrend;
        private boolean resolutionPositive;

        // Getters and setters
        public String getTotalUsers() { return totalUsers; }
        public void setTotalUsers(String totalUsers) { this.totalUsers = totalUsers; }
        public String getUsersTrend() { return usersTrend; }
        public void setUsersTrend(String usersTrend) { this.usersTrend = usersTrend; }
        public boolean isUsersPositive() { return usersPositive; }
        public void setUsersPositive(boolean usersPositive) { this.usersPositive = usersPositive; }

        public String getTotalFacilities() { return totalFacilities; }
        public void setTotalFacilities(String totalFacilities) { this.totalFacilities = totalFacilities; }
        public String getFacilitiesTrend() { return facilitiesTrend; }
        public void setFacilitiesTrend(String facilitiesTrend) { this.facilitiesTrend = facilitiesTrend; }
        public boolean isFacilitiesPositive() { return facilitiesPositive; }
        public void setFacilitiesPositive(boolean facilitiesPositive) { this.facilitiesPositive = facilitiesPositive; }

        public String getMonthlyBookings() { return monthlyBookings; }
        public void setMonthlyBookings(String monthlyBookings) { this.monthlyBookings = monthlyBookings; }
        public String getBookingsTrend() { return bookingsTrend; }
        public void setBookingsTrend(String bookingsTrend) { this.bookingsTrend = bookingsTrend; }
        public boolean isBookingsPositive() { return bookingsPositive; }
        public void setBookingsPositive(boolean bookingsPositive) { this.bookingsPositive = bookingsPositive; }

        public String getAvgResolutionTime() { return avgResolutionTime; }
        public void setAvgResolutionTime(String avgResolutionTime) { this.avgResolutionTime = avgResolutionTime; }
        public String getResolutionTrend() { return resolutionTrend; }
        public void setResolutionTrend(String resolutionTrend) { this.resolutionTrend = resolutionTrend; }
        public boolean isResolutionPositive() { return resolutionPositive; }
        public void setResolutionPositive(boolean resolutionPositive) { this.resolutionPositive = resolutionPositive; }
    }

    public static class MonthlyBookingTrend {
        private String name;
        private int students;
        private int staff;
        private int events;

        public MonthlyBookingTrend() {}
        public MonthlyBookingTrend(String name, int students, int staff, int events) {
            this.name = name;
            this.students = students;
            this.staff = staff;
            this.events = events;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getStudents() { return students; }
        public void setStudents(int students) { this.students = students; }
        public int getStaff() { return staff; }
        public void setStaff(int staff) { this.staff = staff; }
        public int getEvents() { return events; }
        public void setEvents(int events) { this.events = events; }
    }

    public static class FacilityUsage {
        private String name;
        private int value;

        public FacilityUsage() {}
        public FacilityUsage(String name, int value) { this.name = name; this.value = value; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getValue() { return value; }
        public void setValue(int value) { this.value = value; }
    }

    public static class IncidentTrend {
        private String name;
        private int open;
        private int resolved;

        public IncidentTrend() {}
        public IncidentTrend(String name, int open, int resolved) { this.name = name; this.open = open; this.resolved = resolved; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getOpen() { return open; }
        public void setOpen(int open) { this.open = open; }
        public int getResolved() { return resolved; }
        public void setResolved(int resolved) { this.resolved = resolved; }
    }

    public static class SystemUsage {
        private String name;
        private int students;

        public SystemUsage() {}
        public SystemUsage(String name, int students) { this.name = name; this.students = students; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public int getStudents() { return students; }
        public void setStudents(int students) { this.students = students; }
    }
}
