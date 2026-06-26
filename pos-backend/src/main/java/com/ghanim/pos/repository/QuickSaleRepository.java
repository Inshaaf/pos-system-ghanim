package com.ghanim.pos.repository;

import com.ghanim.pos.entity.QuickSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface QuickSaleRepository extends JpaRepository<QuickSale, Long> {
    List<QuickSale> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("SELECT COALESCE(SUM(qs.total), 0) FROM QuickSale qs WHERE qs.createdAt BETWEEN :from AND :to")
    BigDecimal sumTotalBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COALESCE(SUM(qs.total), 0) FROM QuickSale qs WHERE qs.createdAt BETWEEN :from AND :to AND qs.paymentMethod = 'CASH'")
    BigDecimal sumCashBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
