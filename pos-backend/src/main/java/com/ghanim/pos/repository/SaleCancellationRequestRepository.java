package com.ghanim.pos.repository;

import com.ghanim.pos.entity.SaleCancellationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaleCancellationRequestRepository extends JpaRepository<SaleCancellationRequest, Long> {
    boolean existsBySaleTypeAndSaleIdAndStatus(String saleType, Long saleId, String status);
    List<SaleCancellationRequest> findByStatusOrderByRequestedAtDesc(String status);
}
