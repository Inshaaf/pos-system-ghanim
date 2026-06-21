package com.ghanim.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "returns", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Return {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_sale_id")
    @JsonIgnore
    private Sale originalSale;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @JsonIgnore
    private Session session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "salesperson_id")
    @JsonIgnore
    private Salesperson salesperson;

    @Column(nullable = false)
    private String returnType;

    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount;

    private Long exchangeSaleId;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false)
    private String status = "COMPLETED";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "returnRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ReturnItem> returnItems = new ArrayList<>();
}
