package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    Page<Sale> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to, Pageable pageable);

    List<Sale> findBySessionId(Long sessionId);

    List<Sale> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime from, LocalDateTime to);

    List<Sale> findByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT s FROM Sale s WHERE s.createdAt BETWEEN :from AND :to AND s.status = 'COMPLETED'")
    List<Sale> findCompletedSalesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT s FROM Sale s WHERE s.salesperson.id = :id AND s.createdAt BETWEEN :from AND :to")
    List<Sale> findBySalespersonAndDateRange(
            @Param("id") Long salespersonId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("""
        SELECT CAST(s.createdAt AS date), COUNT(s), SUM(s.total)
        FROM Sale s
        WHERE s.createdAt BETWEEN :from AND :to AND s.status = 'COMPLETED'
        GROUP BY CAST(s.createdAt AS date)
        ORDER BY CAST(s.createdAt AS date)
        """)
    List<Object[]> dailySalesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
        SELECT s.salesperson.id, s.salesperson.name, COUNT(s), SUM(s.total)
        FROM Sale s
        WHERE s.createdAt BETWEEN :from AND :to AND s.status = 'COMPLETED'
          AND s.salesperson IS NOT NULL
        GROUP BY s.salesperson.id, s.salesperson.name
        ORDER BY SUM(s.total) DESC
        """)
    List<Object[]> salespersonSalesBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
