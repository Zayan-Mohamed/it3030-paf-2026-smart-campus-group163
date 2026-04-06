package com.smartcampus.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Incident entity representing maintenance tickets for campus facilities.
 * Supports image attachments for incident documentation.
 */
@Entity
@Table(name = "incidents", indexes = {
        @Index(name = "idx_incident_reporter", columnList = "reporter_id"),
        @Index(name = "idx_incident_status", columnList = "status"),
        @Index(name = "idx_incident_priority", columnList = "priority")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Detailed description of the incident
     */
    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Description is required")
    private String description;

    /**
     * User who reported the incident
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @NotNull(message = "Reporter is required")
    private User reporter;

    /**
     * Resource/location where the incident occurred
     */
    @Column(name = "resource_location")
    @NotBlank(message = "Resource/location is required")
    @Size(max = 255, message = "Resource/location must not exceed 255 characters")
    private String resourceLocation;

    /**
     * Category of the incident
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Category is required")
    private IncidentCategory category;

    /**
     * Priority level of the incident
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentPriority priority = IncidentPriority.MEDIUM;

    /**
     * Preferred contact details from the reporter.
     */
    @Column(name = "preferred_contact")
    @NotBlank(message = "Preferred contact is required")
    @Size(max = 255, message = "Preferred contact must not exceed 255 characters")
    private String preferredContact;

    /**
     * Current status of the incident
     */
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private IncidentStatus status = IncidentStatus.OPEN;

    /**
     * Attachment metadata stored separately for up to 3 evidence images.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "incident_attachments", joinColumns = @JoinColumn(name = "incident_id"))
    @Builder.Default
    private List<IncidentAttachment> attachments = new ArrayList<>();

    /**
     * Staff member assigned to handle this incident
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    /**
     * Resolution notes from staff
     */
    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    /**
     * Timestamp when incident was resolved
     */
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Categories of incidents
     */
    public enum IncidentCategory {
        ELECTRICAL,
        PLUMBING,
        HVAC,
        EQUIPMENT,
        CLEANLINESS,
        SECURITY,
        FURNITURE,
        AV_EQUIPMENT,
        NETWORK,
        OTHER
    }

    /**
     * Priority levels for incidents
     */
    public enum IncidentPriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    /**
     * Status of incident resolution
     */
    public enum IncidentStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED,
        CANCELLED
    }
}
