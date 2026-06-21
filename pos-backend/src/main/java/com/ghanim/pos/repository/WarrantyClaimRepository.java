package com.ghanim.pos.repository;

import com.ghanim.pos.entity.WarrantyClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, Long> {

    List<WarrantyClaim> findAllByOrderByCreatedAtDesc();

    List<WarrantyClaim> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT w.productName, COUNT(w) as claimCount FROM WarrantyClaim w " +
           "GROUP BY w.productName ORDER BY claimCount DESC")
    List<Object[]> findProductClaimCounts();
}
