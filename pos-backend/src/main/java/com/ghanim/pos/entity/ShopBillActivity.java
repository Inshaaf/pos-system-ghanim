package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shop_bill_activities", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ShopBillActivity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "bill_id", nullable = false)
    private ShopBill bill;
    @Column(nullable = false)
    private String type;
    @Column(precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "payment_method")
    private String paymentMethod;
    @Column(name = "confirmation_status", nullable = false)
    @Builder.Default private String confirmationStatus = "CONFIRMED";
    @Column(columnDefinition = "TEXT")
    private String reason;
    @Column(name = "follow_up_at")
    private LocalDateTime followUpAt;
    @Column(name = "recorded_by", nullable = false)
    private String recordedBy;
    @Column(name = "reviewed_by")
    private String reviewedBy;
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
