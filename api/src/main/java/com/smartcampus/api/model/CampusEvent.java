package com.smartcampus.api.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "campus_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampusEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @NotBlank(message = "Title is required")
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    @NotBlank(message = "Description is required")
    private String description;

    @Column(name = "event_date", nullable = false)
    @NotNull(message = "Event date is required")
    private LocalDateTime eventDate;

    @Column(name = "location")
    private String location;

    @Column(name = "external_form_url")
    private String externalFormUrl;

    @Column(name = "lfg_enabled", nullable = false)
    @Builder.Default
    private Boolean lfgEnabled = false;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @NotNull(message = "Event type is required")
    private EventType eventType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    private User creator;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum EventType {
        SEMESTER_PROJECT,
        FINAL_YEAR_PROJECT,
        HACKATHON,
        WORKSHOP,
        SOCIAL,
        OTHER
    }
}
