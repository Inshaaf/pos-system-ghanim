package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ReturnItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReturnItemRepository extends JpaRepository<ReturnItem, Long> {
    List<ReturnItem> findByReturnRecordId(Long returnRecordId);
}
