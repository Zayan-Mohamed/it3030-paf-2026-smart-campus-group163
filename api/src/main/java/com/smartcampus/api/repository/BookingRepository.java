package com.smartcampus.api.repository;

import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"facility", "user", "reviewedBy"})
    @Query("select b from Booking b order by b.startTime desc")
    List<Booking> findAllDetailed();

    @EntityGraph(attributePaths = {"facility", "user", "reviewedBy"})
    @Query("select b from Booking b where b.user = :user order by b.startTime desc")
    List<Booking> findAllDetailedByUser(@Param("user") User user);

    @EntityGraph(attributePaths = {"facility", "user", "reviewedBy"})
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findDetailedById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"facility", "user", "reviewedBy"})
    @Query("""
            select b from Booking b
            where b.facility.id = :facilityId
              and b.status in :statuses
              and b.startTime < :endTime
              and b.endTime > :startTime
              and (:excludeBookingId is null or b.id <> :excludeBookingId)
            order by b.startTime asc
            """)
    List<Booking> findConflictingBookings(
            @Param("facilityId") Long facilityId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("statuses") Collection<Booking.BookingStatus> statuses,
            @Param("excludeBookingId") Long excludeBookingId);

    @EntityGraph(attributePaths = {"facility", "user", "reviewedBy"})
    @Query("""
            select b from Booking b
            where (:facilityId is null or b.facility.id = :facilityId)
              and b.startTime < :to
              and b.endTime > :from
            order by b.startTime asc
            """)
    List<Booking> findCalendarBookings(
            @Param("facilityId") Long facilityId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
