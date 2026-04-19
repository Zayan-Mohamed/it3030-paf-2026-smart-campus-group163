package com.smartcampus.api.repository;

import com.smartcampus.api.model.CampusEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CampusEventRepository extends JpaRepository<CampusEvent, Long> {
}
