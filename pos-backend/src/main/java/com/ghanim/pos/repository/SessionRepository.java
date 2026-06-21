package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
    Optional<Session> findFirstByStatusOrderByOpenedAtDesc(String status);

    java.util.List<Session> findAllByOrderByOpenedAtDesc();
}
