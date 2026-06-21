package com.ghanim.pos.repository;

import com.ghanim.pos.entity.StockRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockRequestRepository extends JpaRepository<StockRequest, Long> {
    List<StockRequest> findByStatusOrderByCreatedAtDesc(String status);
    List<StockRequest> findAllByOrderByCreatedAtDesc();
}
