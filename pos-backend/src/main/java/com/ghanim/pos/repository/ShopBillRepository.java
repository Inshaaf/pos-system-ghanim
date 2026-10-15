package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ShopBill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;

public interface ShopBillRepository extends JpaRepository<ShopBill, Long> {
    List<ShopBill> findAllByOrderByCreatedAtDesc();
    List<ShopBill> findByStatusOrderByCreatedAtDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from ShopBill b where b.id = :id")
    java.util.Optional<ShopBill> findByIdForUpdate(@Param("id") Long id);
}
