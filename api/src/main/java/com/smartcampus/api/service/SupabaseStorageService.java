package com.smartcampus.api.service;

import com.smartcampus.api.model.IncidentAttachment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Stores incident attachments in Supabase Storage using service key auth.
 */
@Service
@Slf4j
public class SupabaseStorageService {

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.storage.supabase.url:}")
    private String supabaseUrl;

    @Value("${app.storage.supabase.service-key:}")
    private String serviceKey;

    @Value("${app.storage.supabase.bucket:incident-images}")
    private String bucket;

    public IncidentAttachment uploadIncidentImage(MultipartFile file, Long reporterId) {
        if (supabaseUrl == null || supabaseUrl.isBlank() || serviceKey == null || serviceKey.isBlank()) {
            throw new IllegalStateException(
                    "Supabase storage is not configured. Set app.storage.supabase.url and app.storage.supabase.service-key.");
        }

        String extension = extensionFromMimeType(file.getContentType());
        String sanitizedOriginalName = sanitizeFileName(file.getOriginalFilename());
        String storagePath = "incidents/" + reporterId + "/" + UUID.randomUUID() + "-" + sanitizedOriginalName
                + extension;

        try {
            byte[] bytes = file.getBytes();
            String uploadUrl = stripTrailingSlash(supabaseUrl)
                    + "/storage/v1/object/"
                    + encodePathSegment(bucket)
                    + "/"
                    + encodePath(storagePath);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("Authorization", "Bearer " + serviceKey)
                    .header("apikey", serviceKey)
                    .header("x-upsert", "false")
                    .header("Content-Type",
                            file.getContentType() != null ? file.getContentType()
                                    : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Supabase upload failed with status {}", response.statusCode());
                throw new IllegalStateException("Failed to upload incident attachment");
            }

            String publicUrl = stripTrailingSlash(supabaseUrl)
                    + "/storage/v1/object/public/"
                    + bucket
                    + "/"
                    + encodePath(storagePath);

            return IncidentAttachment.builder()
                    .storagePath(storagePath)
                    .mimeType(file.getContentType() != null ? file.getContentType()
                            : MediaType.APPLICATION_OCTET_STREAM_VALUE)
                    .publicUrl(publicUrl)
                    .build();

        } catch (IOException e) {
            throw new IllegalStateException("Unable to read uploaded file", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Upload interrupted", e);
        }
    }

    private String sanitizeFileName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "attachment";
        }
        return originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private String extensionFromMimeType(String mimeType) {
        if (mimeType == null) {
            return "";
        }
        return switch (mimeType) {
            case MediaType.IMAGE_JPEG_VALUE -> ".jpg";
            case MediaType.IMAGE_PNG_VALUE -> ".png";
            case "image/webp" -> ".webp";
            default -> "";
        };
    }

    private String stripTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private String encodePathSegment(String segment) {
        return URLEncoder.encode(segment, StandardCharsets.UTF_8);
    }

    private String encodePath(String path) {
        String[] parts = path.split("/");
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) {
                builder.append('/');
            }
            builder.append(URLEncoder.encode(parts[i], StandardCharsets.UTF_8));
        }
        return builder.toString();
    }
}
