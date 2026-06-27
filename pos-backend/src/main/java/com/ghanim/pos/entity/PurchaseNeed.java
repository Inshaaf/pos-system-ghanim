package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "purchase_needs", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseNeed {

    public enum Status   { NEEDED, PURCHASED, DISMISSED }
    public enum Category { STORE, PURCHASE }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private BigDecimal quantity;
    private String unit;
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.NEEDED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Category category = Category.PURCHASE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supply_item_id")
    private ShopSupply supplyItem;

    @Column(nullable = false)
    private String requestedBy;

    @CreationTimestamp
    private LocalDateTime requestedAt;

    private String resolvedBy;
    private LocalDateTime resolvedAt;
}
