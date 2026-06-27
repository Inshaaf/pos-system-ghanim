package com.ghanim.pos.controller;

import com.ghanim.pos.entity.PurchaseNeed;
import com.ghanim.pos.service.PurchaseNeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-needs")
@RequiredArgsConstructor
public class PurchaseNeedController {

    private final PurchaseNeedService service;

    @GetMapping
    public List<PurchaseNeed> getAll(@RequestParam(required = false) String search,
                                     @RequestParam(required = false) String status,
                                     @RequestParam(required = false, defaultValue = "false") boolean storeOnly) {
        if (storeOnly) return service.getStoreNeeds();
        if (search != null && !search.isBlank()) return service.search(search.trim());
        if (status != null) return service.getByStatus(PurchaseNeed.Status.valueOf(status.toUpperCase()));
        return service.getAll();
    }

    @PostMapping
    public PurchaseNeed create(@RequestBody Map<String, Object> body) {
        return service.create(body);
    }

    @PatchMapping("/{id}/status")
    public PurchaseNeed updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        PurchaseNeed.Status status = PurchaseNeed.Status.valueOf(body.get("status").toUpperCase());
        return service.updateStatus(id, status, body.get("resolvedBy"));
    }

    @PatchMapping("/{id}/category")
    public PurchaseNeed updateCategory(@PathVariable Long id, @RequestBody Map<String, String> body) {
        PurchaseNeed.Category category = PurchaseNeed.Category.valueOf(body.get("category").toUpperCase());
        return service.updateCategory(id, category);
    }

    @PatchMapping("/{id}/re-request")
    public PurchaseNeed reRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.reRequest(id, body.get("requestedBy"));
    }

    @PatchMapping("/{id}/store-status")
    public PurchaseNeed updateStoreStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body,
                                          Authentication auth) {
        PurchaseNeed.StoreStatus ss = PurchaseNeed.StoreStatus.valueOf(body.get("storeStatus").toUpperCase());
        return service.updateStoreStatus(id, ss, auth.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
