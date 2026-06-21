package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.ExpenseRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.Expense;
import com.ghanim.pos.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<Expense>> create(@RequestBody ExpenseRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(expenseService.create(req), "Expense recorded"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Expense>>> getByDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate d = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getByDate(d)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<Expense>>> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getByRange(from, to)));
    }

    @GetMapping("/summary/daily")
    public ResponseEntity<ApiResponse<Map<String, Double>>> dailySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getDailySummary(date != null ? date : LocalDate.now())));
    }

    @GetMapping("/summary/monthly")
    public ResponseEntity<ApiResponse<Map<String, Double>>> monthlySummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(expenseService.getMonthlySummary(from, to)));
    }

    @PostMapping("/supplier-balance/{supplierId}")
    public ResponseEntity<ApiResponse<Void>> addSupplierBalance(
            @PathVariable Long supplierId,
            @RequestBody Map<String, BigDecimal> body) {
        expenseService.addSupplierBalance(supplierId, body.get("amount"));
        return ResponseEntity.ok(ApiResponse.ok(null, "Supplier balance updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Expense deleted"));
    }
}
