package com.smartcampus.api.repository;

import com.smartcampus.api.model.Incident;
import com.smartcampus.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByReporterOrderByCreatedAtDesc(User reporter);
}
