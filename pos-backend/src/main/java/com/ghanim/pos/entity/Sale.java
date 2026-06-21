package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesperson_id")
    private Salesperson salesperson;

    @Column(nullable = false)
    private String saleType = "RETAIL";

    private String customerName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(precision = 10, scale = 2)
    private BigDecimal itemDiscount = BigDecimal.ZERO;

    @Column(precision = 10, scale = 2)
    private BigDecimal cartDiscount = BigDecimal.ZERO;

    @Column(precision = 5, scale = 2)
    private BigDecimal cartDiscountPct = BigDecimal.ZERO;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private String paymentMethod = "CASH";

    @Column(precision = 10, scale = 2)
    private BigDecimal cashTendered;

    @Column(precision = 10, scale = 2)
    private BigDecimal changeAmount;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private String status = "COMPLETED";

    private String cancelReason;
    private LocalDateTime cancelledAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();
}
