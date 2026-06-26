package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private BigDecimal retailPrice;
    @NotNull
    private BigDecimal wholesalePrice;
    private BigDecimal costPrice;
    private String shopCode;
    private String labelName;
    private String barcode;
    private String unit = "piece";
    private Integer minWholesaleQty = 1;
    private BigDecimal minStockAlert = BigDecimal.ZERO;
    private Long categoryId;
    private Long supplierId;
    private String productSource = "SHOP_DIRECT";
    private String fulfillmentSource = "SHOP";
    private boolean showOnline = true;
    private boolean showInPos = true;
    private BigDecimal onlinePrice;
    private BigDecimal initialStock = BigDecimal.ZERO;
    private String imageUrl;
}
