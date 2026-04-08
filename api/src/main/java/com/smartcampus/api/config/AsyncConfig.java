package com.smartcampus.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Configuration for enabling asynchronous event processing.
 * This allows event listeners to run in separate threads, preventing
 * notification processing from blocking main business logic.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
    // Spring's default async executor will be used
    // For production, consider customizing with ThreadPoolTaskExecutor
}
