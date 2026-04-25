package com.smartcampus.api.config;

import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final UserRepository userRepository;

    @AfterReturning(pointcut = "execution(* com.smartcampus.api.controller.*.*(..)) && !execution(* com.smartcampus.api.controller.AuditLogController.*(..)) && !execution(* com.smartcampus.api.controller.AnalyticsController.*(..))", returning = "result")
    public void logAfterReturning(JoinPoint joinPoint, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes == null) return;
            
            HttpServletRequest request = attributes.getRequest();
            String method = request.getMethod();
            
            // Only log mutating actions for now (POST, PUT, DELETE, PATCH)
            // or specific GETs if needed.
            if ("GET".equalsIgnoreCase(method)) {
                return;
            }

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return;
            }

            User user = null;
            Object principal = auth.getPrincipal();
            if (principal instanceof User) {
                user = (User) principal;
            } else if (principal instanceof String) {
                String email = (String) principal;
                user = userRepository.findByEmail(email).orElse(null);
            } else {
                String name = auth.getName();
                user = userRepository.findByEmail(name).orElse(null);
            }
            
            if (user != null) {
                String action = getActionFromMethod(method);
                String entityType = getEntityTypeFromPath(request.getRequestURI());
                String details = "Invoked " + joinPoint.getSignature().getName() + " on " + request.getRequestURI();
                String ipAddress = request.getRemoteAddr();

                com.smartcampus.api.model.Role primaryRole = user.getRoles().contains(com.smartcampus.api.model.Role.ADMIN) ? com.smartcampus.api.model.Role.ADMIN : 
                               (user.getRoles().contains(com.smartcampus.api.model.Role.STAFF) ? com.smartcampus.api.model.Role.STAFF : com.smartcampus.api.model.Role.STUDENT);

                auditLogService.logAction(
                        user.getId(),
                        user.getName(),
                        primaryRole,
                        action,
                        entityType,
                        null, // Hard to extract generic entityId cleanly here without custom annotations
                        details,
                        ipAddress
                );
            }
        } catch (Exception e) {
            log.error("Failed to log audit event", e);
        }
    }

    private String getActionFromMethod(String method) {
        return switch (method.toUpperCase()) {
            case "POST" -> "CREATE";
            case "PUT", "PATCH" -> "UPDATE";
            case "DELETE" -> "DELETE";
            default -> "ACCESS";
        };
    }

    private String getEntityTypeFromPath(String path) {
        if (path.contains("booking")) return "BOOKING";
        if (path.contains("incident")) return "INCIDENT";
        if (path.contains("user") || path.contains("auth") || path.contains("password")) return "USER";
        if (path.contains("facility")) return "FACILITY";
        if (path.contains("event")) return "EVENT";
        return "SYSTEM";
    }
}
