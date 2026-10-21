package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.CashMovementRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.CashLoan;
import com.ghanim.pos.service.CashService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cash")
@RequiredArgsConstructor
public class CashController {

    private final CashService cashService;

    @PostMapping("/in")
    public ResponseEntity<ApiResponse<CashMovement>> cashIn(@Valid @RequestBody CashMovementRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(cashService.cashIn(request), "Cash added"));
    }

    @PostMapping("/out")
    public ResponseEntity<ApiResponse<CashMovement>> cashOut(@Valid @RequestBody CashMovementRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(cashService.cashOut(request), "Cash removed"));
    }

    @GetMapping("/movements")
    public ResponseEntity<ApiResponse<List<CashMovement>>> getMovements(@RequestParam Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(cashService.getMovements(sessionId)));
    }

    @GetMapping("/loans")
    public ResponseEntity<ApiResponse<List<CashLoan>>> getLoans(
            @RequestParam(defaultValue = "false") boolean outstandingOnly) {
        return ResponseEntity.ok(ApiResponse.ok(cashService.getLoans(outstandingOnly)));
    }
}
