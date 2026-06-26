package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.ShopSupply;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ShopSupplyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shop-supplies")
@RequiredArgsConstructor
public class ShopSupplyController {

    private final ShopSupplyRepository repo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopSupply>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(repo.findByActiveTrueOrderByNameAsc()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ShopSupply>> create(@RequestBody ShopSupply item) {
        item.setId(null);
        return ResponseEntity.ok(ApiResponse.ok(repo.save(item), "Item created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopSupply>> update(@PathVariable Long id, @RequestBody ShopSupply updated) {
        ShopSupply item = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop supply not found: " + id));
        item.setName(updated.getName());
        item.setUnit(updated.getUnit());
        item.setCategory(updated.getCategory());
        item.setActive(updated.isActive());
        return ResponseEntity.ok(ApiResponse.ok(repo.save(item)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        ShopSupply item = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Shop supply not found: " + id));
        item.setActive(false);
        repo.save(item);
        return ResponseEntity.ok(ApiResponse.ok(null, "Item removed"));
    }
}
