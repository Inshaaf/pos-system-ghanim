package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "categories", schema = "public")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "ecommerce_slug")
    private String ecommerceSlug;

    private boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
