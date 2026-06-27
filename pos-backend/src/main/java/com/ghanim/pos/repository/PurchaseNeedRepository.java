package com.ghanim.pos.repository;

import com.ghanim.pos.entity.PurchaseNeed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PurchaseNeedRepository extends JpaRepository<PurchaseNeed, Long> {

    List<PurchaseNeed> findByStatusOrderByRequestedAtDesc(PurchaseNeed.Status status);

    List<PurchaseNeed> findAllByOrderByStatusAscRequestedAtDesc();

    List<PurchaseNeed> findByCategoryOrderByStatusAscRequestedAtDesc(PurchaseNeed.Category category);

    @Query("SELECT n FROM PurchaseNeed n WHERE LOWER(n.name) LIKE LOWER(CONCAT('%', :q, '%')) ORDER BY n.status, n.requestedAt DESC")
    List<PurchaseNeed> searchByName(@Param("q") String query);
}
