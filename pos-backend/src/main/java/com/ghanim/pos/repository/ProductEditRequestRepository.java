package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ProductEditRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductEditRequestRepository extends JpaRepository<ProductEditRequest, Long> {
    List<ProductEditRequest> findByStatusOrderByRequestedAtDesc(String status);
    boolean existsByProductIdAndStatus(Long productId, String status);
}
