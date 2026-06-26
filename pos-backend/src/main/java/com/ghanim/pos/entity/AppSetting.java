package com.ghanim.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_settings", schema = "pos")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AppSetting {

    @Id
    @Column(name = "setting_key", length = 50)
    private String key;

    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;
}
