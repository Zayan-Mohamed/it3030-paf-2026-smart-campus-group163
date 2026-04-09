package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standard error response DTO.
 * Used by GlobalExceptionHandler to return consistent error responses.
 * Implements OWASP best practices for error handling.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    /**
     * HTTP status code
     */
    private int status;
    
    /**
     * Error type/category
     */
    private String error;
    
    /**
     * Error message (safe for client display)
     */
    private String message;
    
    /**
     * Request path where error occurred
     */
    private String path;
    
    /**
     * Timestamp when error occurred
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    
    /**
     * Additional details (e.g., validation field errors as map)
     */
    private Map<String, String> details;
}
