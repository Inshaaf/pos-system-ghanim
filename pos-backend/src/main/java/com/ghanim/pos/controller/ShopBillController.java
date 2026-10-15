package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.ShopBill;
import com.ghanim.pos.entity.ShopBillActivity;
import com.ghanim.pos.service.ShopBillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/shop-bills")
@RequiredArgsConstructor
public class ShopBillController {
    private final ShopBillService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopBill>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(service.getBills()));
    }
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ShopBill>>> pending() {
        return ResponseEntity.ok(ApiResponse.ok(service.getPending()));
    }
    @GetMapping("/payments/pending")
    public ResponseEntity<ApiResponse<List<ShopBillActivity>>> pendingPayments() {
        return ResponseEntity.ok(ApiResponse.ok(service.getPendingPayments()));
    }
    @PostMapping
    public ResponseEntity<ApiResponse<ShopBill>> create(@RequestBody Map<String, Object> body, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(body, auth.getName(),
                auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OWNER")))));
    }
    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ShopBill>> approve(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.review(id, auth.getName(), true)));
    }
    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ShopBill>> reject(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.review(id, auth.getName(), false)));
    }
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<ShopBill>> assign(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        Object salespersonId = body.get("salespersonId");
        boolean owner = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OWNER"));
        return ResponseEntity.ok(ApiResponse.ok(service.assign(id,
                salespersonId == null ? null : Long.valueOf(String.valueOf(salespersonId)), owner)));
    }
    @PostMapping("/{id}/unassign")
    public ResponseEntity<ApiResponse<ShopBill>> unassign(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        boolean owner = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OWNER"));
        return ResponseEntity.ok(ApiResponse.ok(service.unassign(id, body, auth.getName(), owner)));
    }
    @PostMapping("/{id}/payments")
    public ResponseEntity<ApiResponse<ShopBillActivity>> payment(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        boolean owner = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_OWNER"));
        return ResponseEntity.ok(ApiResponse.ok(service.payment(id, body, auth.getName(), owner)));
    }
    @PatchMapping("/payments/{activityId}/approve")
    public ResponseEntity<ApiResponse<ShopBillActivity>> approvePayment(
            @PathVariable Long activityId, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.reviewPayment(activityId, auth.getName(), true,
                body == null ? null : body.get("reviewNote"))));
    }
    @PatchMapping("/payments/{activityId}/reject")
    public ResponseEntity<ApiResponse<ShopBillActivity>> rejectPayment(
            @PathVariable Long activityId, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.reviewPayment(activityId, auth.getName(), false,
                body == null ? null : body.get("reviewNote"))));
    }
    @PostMapping("/{id}/follow-ups")
    public ResponseEntity<ApiResponse<ShopBillActivity>> followUp(
            @PathVariable Long id, @RequestBody Map<String, Object> body, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(service.followUp(id, body, auth.getName())));
    }
    @GetMapping("/{id}/activities")
    public ResponseEntity<ApiResponse<List<ShopBillActivity>>> activities(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getActivities(id)));
    }
    @GetMapping("/follow-ups")
    public ResponseEntity<ApiResponse<List<ShopBillActivity>>> followUps() {
        return ResponseEntity.ok(ApiResponse.ok(service.getFollowUps()));
    }
}
