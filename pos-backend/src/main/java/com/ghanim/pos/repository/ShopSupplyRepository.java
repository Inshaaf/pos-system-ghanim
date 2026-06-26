package com.ghanim.pos.repository;

import com.ghanim.pos.entity.ShopSupply;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopSupplyRepository extends JpaRepository<ShopSupply, Long> {
    List<ShopSupply> findByActiveTrueOrderByNameAsc();
}
