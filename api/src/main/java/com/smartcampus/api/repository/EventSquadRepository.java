package com.smartcampus.api.repository;

import com.smartcampus.api.model.EventSquad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface EventSquadRepository extends JpaRepository<EventSquad, Long> {
    List<EventSquad> findByEventId(Long eventId);

    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM EventSquad s JOIN s.members m WHERE s.event.id = :eventId AND m.id = :userId")
    boolean existsByEventIdAndMembersId(@Param("eventId") Long eventId, @Param("userId") Long userId);
}
