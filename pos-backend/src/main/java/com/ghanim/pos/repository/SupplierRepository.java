package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    List<Supplier> findByActiveTrue();
    List<Supplier> findByActiveTrueAndType(Supplier.Type type);
}
