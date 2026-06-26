package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.ShopCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/app-settings")
@RequiredArgsConstructor
public class AppSettingController {

    private final ShopCodeService shopCodeService;

    @GetMapping("/shop-code-cipher")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<String>> getCipher() {
        return ResponseEntity.ok(ApiResponse.ok(shopCodeService.getCipherKey()));
    }

    @PutMapping("/shop-code-cipher")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<String>> setCipher(@RequestBody Map<String, String> body) {
        String key = body.getOrDefault("value", "");
        shopCodeService.setCipherKey(key);
        return ResponseEntity.ok(ApiResponse.ok(key, "Cipher updated"));
    }
}
