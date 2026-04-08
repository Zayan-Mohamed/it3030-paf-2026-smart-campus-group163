package com.smartcampus.api.repository;

import com.smartcampus.api.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Notification entity operations.
 * Provides custom queries for fetching user-specific notifications.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    /**
     * Find top 20 unread notifications for a specific user, ordered by creation time (most recent first).
     * This is used to populate the notification dropdown in the UI.
     * 
     * @param userId The ID of the user (recipient)
     * @return List of up to 20 unread notifications
     */
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.isRead = false ORDER BY n.createdAt DESC")
    List<Notification> findTop20UnreadByUserId(@Param("userId") Long userId);
    
    /**
     * Find all notifications for a specific user, ordered by creation time (most recent first).
     * Can be used for a full notification history page.
     * 
     * @param userId The ID of the user (recipient)
     * @return List of all notifications for the user
     */
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId ORDER BY n.createdAt DESC")
    List<Notification> findAllByUserId(@Param("userId") Long userId);
    
    /**
     * Count unread notifications for a specific user.
     * Used to display the notification badge count.
     * 
     * @param userId The ID of the user (recipient)
     * @return Number of unread notifications
     */
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :userId AND n.isRead = false")
    Long countUnreadByUserId(@Param("userId") Long userId);
}
