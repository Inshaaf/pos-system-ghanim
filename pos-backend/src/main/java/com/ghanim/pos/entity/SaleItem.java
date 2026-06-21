package com.ghanim.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id")
    @JsonIgnore
    private Sale sale;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"stockLocations", "category", "supplier", "hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(nullable = false)
    private String productName;

    private String barcode;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private String priceType = "RETAIL";

    @Column(precision = 10, scale = 2)
    private BigDecimal itemDiscount = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal itemDiscountPct = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}
