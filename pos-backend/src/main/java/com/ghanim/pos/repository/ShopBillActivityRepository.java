package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ShopBillActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShopBillActivityRepository extends JpaRepository<ShopBillActivity, Long> {
    List<ShopBillActivity> findByBillIdOrderByCreatedAtDesc(Long billId);
    List<ShopBillActivity> findByTypeAndConfirmationStatusOrderByCreatedAtDesc(String type, String confirmationStatus);
    boolean existsByBillIdAndTypeAndConfirmationStatus(Long billId, String type, String confirmationStatus);

    @Query("select distinct a.bill.id from ShopBillActivity a where a.type = 'PAYMENT' and a.confirmationStatus = 'PENDING_CONFIRMATION'")
    List<Long> findBillIdsWithPendingPayments();

    @Query("select a from ShopBillActivity a where a.id = :id and a.type = 'PAYMENT' and a.confirmationStatus = 'PENDING_CONFIRMATION'")
    java.util.Optional<ShopBillActivity> findPendingPaymentById(@Param("id") Long id);

    @Query("select a from ShopBillActivity a where a.type = 'FOLLOW_UP' and a.bill.status = 'OPEN' order by a.followUpAt asc, a.createdAt desc")
    List<ShopBillActivity> findOpenBillFollowUps();
}
