package com.ghanim.pos.repository;

import com.ghanim.pos.entity.SaleItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleItemRepository extends JpaRepository<SaleItem, Long> {
    List<SaleItem> findBySaleId(Long saleId);

    @Query("""
        SELECT si.product.id, si.productName,
               COALESCE(si.product.category.name, 'Uncategorized'),
               SUM(si.quantity), SUM(si.subtotal),
               SUM((si.unitPrice - COALESCE(si.product.costPrice, 0)) * si.quantity - si.itemDiscount)
        FROM SaleItem si
        WHERE si.sale.createdAt BETWEEN :from AND :to
          AND si.sale.status = 'COMPLETED'
          AND si.product IS NOT NULL
        GROUP BY si.product.id, si.productName, si.product.category.name
        ORDER BY SUM(si.quantity) DESC
        """)
    List<Object[]> productSalesSummary(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
        SELECT CAST(si.sale.createdAt AS date), SUM(si.subtotal),
               SUM((si.unitPrice - COALESCE(si.product.costPrice, 0)) * si.quantity - si.itemDiscount)
        FROM SaleItem si
        WHERE si.sale.createdAt BETWEEN :from AND :to
          AND si.sale.status = 'COMPLETED'
        GROUP BY CAST(si.sale.createdAt AS date)
        ORDER BY CAST(si.sale.createdAt AS date)
        """)
    List<Object[]> dailyRevenueBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
