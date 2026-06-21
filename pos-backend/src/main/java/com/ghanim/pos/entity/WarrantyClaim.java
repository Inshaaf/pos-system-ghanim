package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "warranty_claims", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WarrantyClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    private String customerPhone;

    private Long productId;

    @Column(nullable = false)
    private String productName;

    private Long originalSaleId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String issueDescription;

    @Column(nullable = false)
    private String status = "PENDING";

    private String resolutionType;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private String handledBy;

    private LocalDateTime claimDate;

    private LocalDateTime resolvedDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
