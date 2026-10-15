package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "product_edit_requests", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductEditRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    @Column(nullable = false)
    private String productName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String currentData;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String proposedData;

    @Column(nullable = false)
    private String requestedBy;

    @Builder.Default
    @Column(nullable = false)
    private String status = "PENDING";

    private String reviewedBy;
    private String reviewNote;
    @CreationTimestamp
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
}
