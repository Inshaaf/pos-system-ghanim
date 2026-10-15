package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
    List<ReturnItem> findByReturnRecordId(Long returnRecordId);

    @Query("""
        SELECT ri.product.id, ri.productName, COALESCE(ri.product.category.name, 'Uncategorized'),
               SUM(ri.quantity), SUM(ri.subtotal),
               SUM(CASE WHEN ri.costPriceSnapshot IS NOT NULL AND ri.costPriceSnapshot > 0
                   THEN ri.subtotal ELSE 0 END),
               SUM(CASE WHEN ri.costPriceSnapshot IS NOT NULL AND ri.costPriceSnapshot > 0
                   THEN (ri.unitPrice - ri.costPriceSnapshot) * ri.quantity ELSE 0 END)
        FROM ReturnItem ri
        WHERE ri.returnRecord.createdAt BETWEEN :from AND :to
          AND ri.returnRecord.status = 'COMPLETED'
          AND ri.product IS NOT NULL
        GROUP BY ri.product.id, ri.productName, ri.product.category.name
        """)
    List<Object[]> productReturnsBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
