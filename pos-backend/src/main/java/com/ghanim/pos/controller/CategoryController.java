package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Category;
import com.ghanim.pos.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.getAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.create(body.get("name")), "Category created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.update(id, body.get("name"))));
    }

    @PatchMapping("/{id}/slug")
    public ResponseEntity<ApiResponse<Category>> updateSlug(
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok(categoryService.updateSlug(id, body.get("ecommerceSlug"))));
    }
}
