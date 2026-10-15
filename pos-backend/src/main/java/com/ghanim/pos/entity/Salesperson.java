package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "salespersons", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Salesperson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    @Column(name = "active_for_collection", nullable = false)
    private boolean activeForCollection = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
