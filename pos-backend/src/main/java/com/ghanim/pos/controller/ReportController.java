package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<Map<String, Object>>> daily(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) date = LocalDate.now(ZoneId.of("Asia/Colombo"));
        return ResponseEntity.ok(ApiResponse.ok(reportService.getDailyReport(date)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> range(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getRangeReport(from, to)));
    }

    @GetMapping("/salespersons")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> salespersons(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSalespersonReport(from, to)));
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> products(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getProductReport(from, to)));
    }

    @GetMapping("/manual-items")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> manualItems(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getManualItemReport(from, to)));
    }

    @GetMapping("/slow-stock")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> slowStock(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getSlowMovingStock(days)));
    }

    @GetMapping("/cash-flow")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> cashFlow(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCashFlowReport(from, to)));
    }

    @GetMapping("/cash-movements")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> cashMovements(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam String type) {
        return ResponseEntity.ok(ApiResponse.ok(reportService.getCashMovementDetails(from, to, type)));
    }
}
