package com.ghanim.pos.repository;

import com.ghanim.pos.entity.SupplierDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SupplierDeliveryRepository extends JpaRepository<SupplierDelivery, Long> {

    List<SupplierDelivery> findBySupplierIdOrderByDeliveredAtDescCreatedAtDesc(Long supplierId);

    @Query("""
        SELECT d.supplyItem.id, d.supplyItem.name, d.supplier.id, d.supplier.name,
               AVG(d.unitPrice), MIN(d.unitPrice), MAX(d.unitPrice), MAX(d.deliveredAt)
        FROM SupplierDelivery d
        WHERE d.supplyItem IS NOT NULL
        GROUP BY d.supplyItem.id, d.supplyItem.name, d.supplier.id, d.supplier.name
        ORDER BY d.supplyItem.name, AVG(d.unitPrice)
    """)
    List<Object[]> findPriceComparison();

    @Query("""
        SELECT d.supplyItem.id, d.supplyItem.name, d.supplier.id, d.supplier.name,
               AVG(d.unitPrice), MIN(d.unitPrice), MAX(d.unitPrice), MAX(d.deliveredAt)
        FROM SupplierDelivery d
        WHERE d.supplyItem.id = :supplyItemId
        GROUP BY d.supplyItem.id, d.supplyItem.name, d.supplier.id, d.supplier.name
        ORDER BY AVG(d.unitPrice)
    """)
    List<Object[]> findPriceComparisonByItem(@Param("supplyItemId") Long supplyItemId);
}
