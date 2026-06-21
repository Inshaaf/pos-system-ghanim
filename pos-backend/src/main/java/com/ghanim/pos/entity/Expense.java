package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "expenses", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {

    public enum Category {
        SUPPLIER_PAYMENT, TEA, BUS_FARE, TEMP_WORKER, SALARY, OTHER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(columnDefinition = "TEXT")
    private String note;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "salesperson_id")
    private Salesperson salesperson;

    @Column(nullable = false)
    private LocalDate expenseDate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
