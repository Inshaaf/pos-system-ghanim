package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_requests", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StockRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal currentQty;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal requestedQty;

    @Column(nullable = false)
    private String reason;

    private String notes;

    @Column(nullable = false)
    private String requestedBy;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING";

    private String reviewNote;
    private String reviewedBy;

    @CreationTimestamp
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;
}
