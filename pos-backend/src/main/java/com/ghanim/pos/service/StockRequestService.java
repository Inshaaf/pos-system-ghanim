package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.StockAdjustmentRequest;
import com.ghanim.pos.entity.StockRequest;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.StockRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StockRequestService {

    private final StockRequestRepository stockRequestRepository;
    private final StockService stockService;

    public StockRequest create(StockRequest request) {
        request.setStatus("PENDING");
        return stockRequestRepository.save(request);
    }

    public List<StockRequest> getPending() {
        return stockRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public List<StockRequest> getAll() {
        return stockRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public StockRequest approve(Long id, String reviewedBy, String reviewNote) {
        StockRequest req = stockRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock request not found: " + id));

        StockAdjustmentRequest adj = new StockAdjustmentRequest();
        adj.setProductId(req.getProductId());
        adj.setNewQuantity(req.getRequestedQty());
        adj.setReason(req.getReason());
        adj.setNotes("Approved request from " + req.getRequestedBy() + (reviewNote != null ? " — " + reviewNote : ""));
        adj.setAdjustedBy(reviewedBy);
        stockService.adjustStock(adj);

        req.setStatus("APPROVED");
        req.setReviewedBy(reviewedBy);
        req.setReviewNote(reviewNote);
        req.setReviewedAt(LocalDateTime.now());
        return stockRequestRepository.save(req);
    }

    @Transactional
    public StockRequest reject(Long id, String reviewedBy, String reviewNote) {
        StockRequest req = stockRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock request not found: " + id));

        req.setStatus("REJECTED");
        req.setReviewedBy(reviewedBy);
        req.setReviewNote(reviewNote);
        req.setReviewedAt(LocalDateTime.now());
        return stockRequestRepository.save(req);
    }
}
