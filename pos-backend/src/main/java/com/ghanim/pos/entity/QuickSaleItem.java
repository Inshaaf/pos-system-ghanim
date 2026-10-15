package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "quick_sale_items", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuickSaleItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quick_sale_id", nullable = false)
    private QuickSale quickSale;

    // null = manually entered item; non-null = POS product (stock will be deducted)
    @Column(name = "product_id")
    private Long productId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manual_product_id")
    private ManualProduct manualProduct;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "cost_price_snapshot", precision = 10, scale = 2)
    private BigDecimal costPriceSnapshot;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;
}
