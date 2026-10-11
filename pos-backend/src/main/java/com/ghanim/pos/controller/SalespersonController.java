package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.service.SalespersonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/salespersons")
@RequiredArgsConstructor
public class SalespersonController {

    private final SalespersonService salespersonService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Salesperson>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(salespersonService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Salesperson>> create(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(salespersonService.create(body.get("name")), "Salesperson created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Salesperson>> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        boolean active = body.containsKey("active") ? (boolean) body.get("active") : true;
        return ResponseEntity.ok(ApiResponse.ok(salespersonService.update(id, name, active)));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Salesperson>> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(salespersonService.deactivate(id), "Salesperson deactivated"));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<Salesperson>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(salespersonService.activate(id), "Salesperson activated"));
    }
}
