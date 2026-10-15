package com.ghanim.pos.repository;

import com.ghanim.pos.entity.CashMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;

public interface CashMovementRepository extends JpaRepository<CashMovement, Long> {
    List<CashMovement> findBySessionId(Long sessionId);
    List<CashMovement> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);
    List<CashMovement> findByCreatedAtBetweenOrderByCreatedAtAsc(LocalDateTime from, LocalDateTime to);
}
