package com.smartcampus.api.config;

import com.smartcampus.api.security.JwtChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time notifications using STOMP protocol.
 * 
 * Architecture:
 * - STOMP endpoint: /ws-notifications (handshake URL)
 * - Message broker: /topic (broadcast), /user (user-specific)
 * - Application destination prefix: /app
 * - User-specific queue: /user/{username}/queue/notifications
 * 
 * Security:
 * - JWT authentication via JwtChannelInterceptor
 * - CORS enabled for Vite frontend origins
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    private final JwtChannelInterceptor jwtChannelInterceptor;
    
    /**
     * Register STOMP endpoints for WebSocket handshake.
     * Clients connect to /ws-notifications to establish WebSocket connection.
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws-notifications")
                // Allow CORS for frontend origins
                .setAllowedOriginPatterns(
                        "http://localhost:*",
                        "http://127.0.0.1:*"
                );
    }
    
    /**
     * Configure message broker for routing messages.
     * - /topic: broadcast to all subscribers
     * - /user: send to specific users (e.g., /user/{username}/queue/notifications)
     * - /app: application destination prefix for client-to-server messages
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for /topic and /user destinations
        registry.enableSimpleBroker("/topic", "/user");
        
        // Set application destination prefix for client messages
        registry.setApplicationDestinationPrefixes("/app");
        
        // Set user destination prefix (default is /user)
        registry.setUserDestinationPrefix("/user");
    }
    
    /**
     * Configure inbound channel interceptors for JWT authentication.
     * The JwtChannelInterceptor validates JWT tokens during STOMP CONNECT frames.
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(jwtChannelInterceptor);
    }
}
