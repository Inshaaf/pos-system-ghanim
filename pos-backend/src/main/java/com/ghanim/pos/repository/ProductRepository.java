package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcode(String barcode);

    List<Product> findByShowInPosTrueAndActiveTrue();

    @Query("SELECT p FROM Product p LEFT JOIN p.category c " +
           "WHERE p.showInPos = true AND p.active = true " +
           "AND (LOWER(p.name)        LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(p.barcode)     LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(c.name)        LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> searchProducts(@Param("search") String search);

    @Query("SELECT p FROM Product p LEFT JOIN p.category c " +
           "WHERE p.showInPos = true AND p.active = true " +
           "AND p.category.id = :categoryId " +
           "AND (LOWER(p.name)        LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(p.barcode)     LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')) " +
           " OR  LOWER(c.name)        LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Product> searchProductsByCategory(@Param("search") String search, @Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p WHERE p.showInPos = true AND p.active = true " +
           "AND p.category.id = :categoryId")
    List<Product> findByCategoryAndShowInPos(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.stockLocations sl " +
           "WHERE sl.location = 'SHOP' AND sl.quantity < p.minStockAlert AND p.active = true")
    List<Product> findLowStockProducts();

    Page<Product> findAllByActiveTrue(Pageable pageable);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.stockLocations LEFT JOIN FETCH p.category WHERE p.active = true")
    List<Product> findAllActiveWithStock();

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.stockLocations LEFT JOIN FETCH p.category WHERE p.active = true AND p.supplier.id = :supplierId")
    List<Product> findBySupplierIdAndActiveTrue(@Param("supplierId") Long supplierId);
}
