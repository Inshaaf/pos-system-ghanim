package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shop_bills", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ShopBill {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_name", nullable = false)
    private String customerName;
    @Column(name = "bill_number", nullable = false)
    private String billNumber;
    @Column(nullable = false)
    private String category;
    @Column(name = "bill_type", nullable = false)
    private String billType;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "paid_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default private BigDecimal paidAmount = BigDecimal.ZERO;
    @Column(nullable = false)
    @Builder.Default private String status = "PENDING_APPROVAL";
    @Column(name = "requested_by", nullable = false)
    private String requestedBy;
    @Column(name = "reviewed_by")
    private String reviewedBy;
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "salesperson_id")
    private Salesperson salesperson;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Transient
    private boolean paymentAwaitingConfirmation;

    @Transient
    public BigDecimal getRemainingAmount() {
        return amount == null || paidAmount == null ? BigDecimal.ZERO : amount.subtract(paidAmount).max(BigDecimal.ZERO);
    }
}
