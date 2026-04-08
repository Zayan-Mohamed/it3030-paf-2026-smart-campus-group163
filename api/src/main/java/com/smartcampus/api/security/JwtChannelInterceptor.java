package com.smartcampus.api.security;

import com.smartcampus.api.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Channel interceptor for authenticating WebSocket connections using JWT.
 * 
 * This interceptor:
 * 1. Extracts JWT token from STOMP CONNECT frame headers
 * 2. Validates the JWT token
 * 3. Sets the authenticated user in the STOMP session
 * 
 * The frontend must send JWT in the STOMP connection headers:
 * {
 *   "Authorization": "Bearer <jwt-token>"
 * }
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor {
    
    private final JwtService jwtService;
    
    /**
     * Intercept messages before they are sent to the channel.
     * For CONNECT frames, extract and validate JWT token.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Extract Authorization header from STOMP CONNECT frame
            List<String> authorizationHeaders = accessor.getNativeHeader("Authorization");
            
            if (authorizationHeaders != null && !authorizationHeaders.isEmpty()) {
                String authHeader = authorizationHeaders.get(0);
                
                // Check if Authorization header starts with "Bearer "
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    try {
                        // Extract token from "Bearer <token>"
                        String token = authHeader.substring(7);
                        
                        // Validate token
                        if (jwtService.validateToken(token)) {
                            // Extract user email and roles from token
                            String email = jwtService.extractEmail(token);
                            List<String> roles = jwtService.extractRoles(token);
                            
                            // Convert roles to authorities
                            List<SimpleGrantedAuthority> authorities = roles.stream()
                                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                                    .collect(Collectors.toList());
                            
                            // Create authentication token
                            UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(email, null, authorities);
                            
                            // Set user in STOMP session
                            accessor.setUser(authentication);
                            
                            log.info("WebSocket connection authenticated for user: {}", email);
                        } else {
                            log.warn("Invalid JWT token in WebSocket connection");
                        }
                    } catch (Exception e) {
                        log.error("Error authenticating WebSocket connection", e);
                    }
                } else {
                    log.warn("WebSocket connection missing Bearer token");
                }
            } else {
                log.warn("WebSocket connection missing Authorization header");
            }
        }
        
        return message;
    }
}
