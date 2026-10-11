package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "sale_cancellation_requests", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SaleCancellationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sale_type", nullable = false, length = 20)
    private String saleType;

    @Column(name = "sale_id", nullable = false)
    private Long saleId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "requested_by", nullable = false, length = 100)
    private String requestedBy;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "reviewed_by", length = 100)
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;
}
