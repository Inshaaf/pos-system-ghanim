package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.ReturnRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Return;
import com.ghanim.pos.service.ReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping
    public ResponseEntity<ApiResponse<Return>> processReturn(@Valid @RequestBody ReturnRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.processReturn(request), "Return processed"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getByDate(
            @RequestParam(defaultValue = "") String date) {
        LocalDate d = date.isBlank() ? LocalDate.now() : LocalDate.parse(date);
        return ResponseEntity.ok(ApiResponse.ok(returnService.getByDate(d)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Return>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(returnService.getById(id)));
    }
}
