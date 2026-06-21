package com.ghanim.pos.repository;

import com.ghanim.pos.entity.TempWorker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TempWorkerRepository extends JpaRepository<TempWorker, Long> {
    List<TempWorker> findByActiveTrue();
}
