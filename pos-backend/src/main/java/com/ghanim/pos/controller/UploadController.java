package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @Value("${imagekit.private-key}")
    private String privateKey;

    private static final String IMAGEKIT_UPLOAD_URL = "https://upload.imagekit.io/api/v1/files/upload";

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> upload(
            @RequestParam("file") MultipartFile file) throws Exception {

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only image files are allowed"));
        }

        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String fileName = UUID.randomUUID().toString().replace("-", "").substring(0, 16) + ext;

        // ImageKit basic auth: "privateKey:" base64-encoded
        String credentials = privateKey + ":";
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("Authorization", "Basic " + encoded);

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override public String getFilename() { return fileName; }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        body.add("fileName", fileName);
        body.add("folder", "/pos");
        body.add("useUniqueFileName", "false");

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(IMAGEKIT_UPLOAD_URL, request, Map.class);

        if (response == null || !response.containsKey("url")) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("ImageKit upload failed"));
        }

        String imageUrl = (String) response.get("url");
        return ResponseEntity.ok(ApiResponse.ok(Map.of("url", imageUrl), "Uploaded successfully"));
    }
}
