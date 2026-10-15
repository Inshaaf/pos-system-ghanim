package com.ghanim.pos.repository;

import com.ghanim.pos.entity.QuickSaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface QuickSaleItemRepository extends JpaRepository<QuickSaleItem, Long> {

    @Query("""
        SELECT MIN(qi.name), SUM(qi.quantity), SUM(qi.subtotal)
        FROM QuickSaleItem qi
        WHERE qi.quickSale.createdAt BETWEEN :from AND :to
          AND qi.quickSale.status <> 'CANCELLED'
          AND qi.productId IS NULL
        GROUP BY LOWER(qi.name)
        ORDER BY SUM(qi.subtotal) DESC
        """)
    List<Object[]> manualItemSalesBetween(@Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);

    @Query("""
        SELECT p.id, qi.name, COALESCE(p.category.name, 'Uncategorized'),
               SUM(qi.quantity), SUM(qi.subtotal),
               SUM(CASE WHEN qi.costPriceSnapshot IS NOT NULL AND qi.costPriceSnapshot > 0
                   THEN qi.subtotal ELSE 0 END),
               SUM(CASE WHEN qi.costPriceSnapshot IS NOT NULL AND qi.costPriceSnapshot > 0
                   THEN (qi.unitPrice - qi.costPriceSnapshot) * qi.quantity ELSE 0 END)
        FROM QuickSaleItem qi JOIN Product p ON p.id = qi.productId
        WHERE qi.quickSale.createdAt BETWEEN :from AND :to
          AND qi.quickSale.status <> 'CANCELLED'
          AND qi.productId IS NOT NULL
        GROUP BY p.id, qi.name, p.category.name
        ORDER BY SUM(qi.quantity) DESC
        """)
    List<Object[]> posProductSalesSummary(@Param("from") LocalDateTime from,
                                          @Param("to") LocalDateTime to);
}
