package com.ghanim.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_adjustments", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockAdjustment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"stockLocations", "category", "supplier", "hibernateLazyInitializer", "handler"})
    private Product product;

    @Column(nullable = false)
    private String location = "SHOP";

    @Column(precision = 10, scale = 2)
    private BigDecimal previousQty;

    @Column(precision = 10, scale = 2)
    private BigDecimal newQty;

    @Column(precision = 10, scale = 2)
    private BigDecimal difference;

    private String reason;
    private String adjustedBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
