package com.ghanim.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", schema = "public")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Existing ecommerce columns — do not change
    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal retailPrice;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal wholesalePrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal costPrice;

    private BigDecimal stock; // legacy — ecommerce reads this; NUMERIC in DB

    private String emoji;
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    private Badge badge;

    @Column(nullable = false)
    private boolean active = true;

    @Column(columnDefinition = "TEXT")
    private String specifications;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    @JsonIgnore
    private Category category;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // POS-specific columns (added via ALTER TABLE)
    private String shopCode;
    private String barcode;
    private String unit = "piece";
    private Integer minWholesaleQty = 1;

    @Column(precision = 10, scale = 2)
    private BigDecimal minStockAlert = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal onlinePrice;

    @Enumerated(EnumType.STRING)
    private ProductSource productSource = ProductSource.SHOP_DIRECT;

    @Enumerated(EnumType.STRING)
    private FulfillmentSource fulfillmentSource = FulfillmentSource.SHOP;

    private boolean showOnline = true;
    private boolean showInPos = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    @JsonIgnore
    private Supplier supplier;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<StockLocation> stockLocations = new ArrayList<>();

    @Transient
    public BigDecimal getShopStock() {
        return stockLocations.stream()
                .filter(sl -> "SHOP".equals(sl.getLocation()))
                .map(StockLocation::getQuantity)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    public enum Badge { SALE, NEW, BEST_SELLER }

    public enum ProductSource { STORE_PRODUCT, SHOP_DIRECT, BOTH }

    public enum FulfillmentSource { STORE, SHOP }
}
