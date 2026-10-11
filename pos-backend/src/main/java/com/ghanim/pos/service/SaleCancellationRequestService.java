package com.ghanim.pos.service;

import com.ghanim.pos.entity.QuickSale;
import com.ghanim.pos.entity.Sale;
import com.ghanim.pos.entity.SaleCancellationRequest;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.QuickSaleRepository;
import com.ghanim.pos.repository.SaleCancellationRequestRepository;
import com.ghanim.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SaleCancellationRequestService {

    private static final String PENDING = "PENDING";
    private static final ZoneId COLOMBO = ZoneId.of("Asia/Colombo");

    private final SaleCancellationRequestRepository requestRepository;
    private final SaleRepository saleRepository;
    private final QuickSaleRepository quickSaleRepository;
    private final SaleService saleService;
    private final QuickSaleService quickSaleService;

    @Transactional
    public Map<String, Object> request(String saleType, Long saleId, String reason, String requestedBy) {
        String type = normalizeType(saleType);
        if (saleId == null) throw new IllegalArgumentException("Sale ID is required");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Cancellation reason is required");
        if (requestedBy == null || requestedBy.isBlank()) throw new IllegalArgumentException("Requester is required");
        ensureCancellable(type, saleId);
        if (requestRepository.existsBySaleTypeAndSaleIdAndStatus(type, saleId, PENDING)) {
            throw new IllegalArgumentException("A cancellation request is already pending for this sale");
        }

        SaleCancellationRequest request = requestRepository.save(SaleCancellationRequest.builder()
                .saleType(type)
                .saleId(saleId)
                .reason(reason.trim())
                .requestedBy(requestedBy)
                .requestedAt(LocalDateTime.now(COLOMBO))
                .status(PENDING)
                .build());
        return toView(request);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPending() {
        return requestRepository.findByStatusOrderByRequestedAtDesc(PENDING).stream()
                .map(this::toView).toList();
    }

    @Transactional
    public Map<String, Object> review(Long id, boolean approve, String reviewedBy) {
        SaleCancellationRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cancellation request not found"));
        if (!PENDING.equals(request.getStatus())) {
            throw new IllegalArgumentException("This cancellation request has already been reviewed");
        }
        if (approve) {
            if ("SALE".equals(request.getSaleType())) {
                saleService.cancelAfterApproval(request.getSaleId(), request.getReason());
            } else {
                quickSaleService.cancelAfterApproval(request.getSaleId(), request.getReason());
            }
            request.setStatus("APPROVED");
        } else {
            request.setStatus("REJECTED");
        }
        request.setReviewedBy(reviewedBy);
        request.setReviewedAt(LocalDateTime.now(COLOMBO));
        return toView(requestRepository.save(request));
    }

    private void ensureCancellable(String type, Long id) {
        if ("SALE".equals(type)) {
            Sale sale = saleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + id));
            if (!"COMPLETED".equals(sale.getStatus())) throw new IllegalArgumentException("Sale cannot be cancelled");
        } else {
            QuickSale sale = quickSaleRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Quick sale not found: " + id));
            if (!"COMPLETED".equals(sale.getStatus()) && !"CREDIT".equals(sale.getStatus())) {
                throw new IllegalArgumentException("Quick sale cannot be cancelled");
            }
        }
    }

    private String normalizeType(String saleType) {
        String type = saleType == null ? "" : saleType.trim().toUpperCase();
        if (!"SALE".equals(type) && !"QUICK_SALE".equals(type)) {
            throw new IllegalArgumentException("Sale type must be SALE or QUICK_SALE");
        }
        return type;
    }

    private Map<String, Object> toView(SaleCancellationRequest request) {
        Map<String, Object> view = new HashMap<>();
        view.put("id", request.getId());
        view.put("saleType", request.getSaleType());
        view.put("saleId", request.getSaleId());
        view.put("reason", request.getReason());
        view.put("requestedBy", request.getRequestedBy());
        view.put("requestedAt", request.getRequestedAt());
        view.put("status", request.getStatus());
        if ("SALE".equals(request.getSaleType())) {
            saleRepository.findById(request.getSaleId()).ifPresent(sale -> addSaleData(view, sale));
        } else {
            quickSaleRepository.findById(request.getSaleId()).ifPresent(sale -> addQuickSaleData(view, sale));
        }
        return view;
    }

    private void addSaleData(Map<String, Object> view, Sale sale) {
        view.put("total", sale.getTotal());
        view.put("paymentMethod", sale.getPaymentMethod());
        view.put("saleStatus", sale.getStatus());
        view.put("createdAt", sale.getCreatedAt());
        view.put("salesperson", sale.getSalesperson() != null ? sale.getSalesperson().getName() : "");
    }

    private void addQuickSaleData(Map<String, Object> view, QuickSale sale) {
        view.put("total", sale.getTotal());
        view.put("paymentMethod", sale.getPaymentMethod());
        view.put("saleStatus", sale.getStatus());
        view.put("createdAt", sale.getCreatedAt());
        view.put("salesperson", sale.getSalesperson() != null ? sale.getSalesperson().getName() : "");
    }
}
