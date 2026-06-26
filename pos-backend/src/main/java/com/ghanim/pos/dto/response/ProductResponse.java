package com.ghanim.pos.dto.response;

import com.ghanim.pos.entity.Product;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private String shopCode;
    private String labelName;
    private String barcode;
    private Long categoryId;
    private String categoryName;
    private Long supplierId;
    private String supplierName;
    private BigDecimal retailPrice;
    private BigDecimal wholesalePrice;
    private BigDecimal costPrice;
    private BigDecimal onlinePrice;
    private Integer minWholesaleQty;
    private BigDecimal minStockAlert;
    private BigDecimal stockQuantity;
    private String unit;
    private String imageUrl;
    private String emoji;
    private boolean active;
    private boolean showInPos;
    private boolean showOnline;
    private String productSource;
    private String fulfillmentSource;
    private String badge;

    public static ProductResponse from(Product p, BigDecimal shopStock) {
        ProductResponse r = new ProductResponse();
        r.id = p.getId();
        r.name = p.getName();
        r.description = p.getDescription();
        r.shopCode = p.getShopCode();
        r.labelName = p.getLabelName();
        r.barcode = p.getBarcode();
        r.categoryId = p.getCategory() != null ? p.getCategory().getId() : null;
        r.categoryName = p.getCategory() != null ? p.getCategory().getName() : null;
        r.supplierId = p.getSupplier() != null ? p.getSupplier().getId() : null;
        r.supplierName = p.getSupplier() != null ? p.getSupplier().getName() : null;
        r.retailPrice = p.getRetailPrice();
        r.wholesalePrice = p.getWholesalePrice();
        r.costPrice = p.getCostPrice();
        r.onlinePrice = p.getOnlinePrice();
        r.minWholesaleQty = p.getMinWholesaleQty();
        r.minStockAlert = p.getMinStockAlert();
        r.stockQuantity = shopStock;
        r.unit = p.getUnit();
        r.imageUrl = p.getImageUrl();
        r.emoji = p.getEmoji();
        r.active = p.isActive();
        r.showInPos = p.isShowInPos();
        r.showOnline = p.isShowOnline();
        r.productSource = p.getProductSource() != null ? p.getProductSource().name() : null;
        r.fulfillmentSource = p.getFulfillmentSource() != null ? p.getFulfillmentSource().name() : null;
        r.badge = p.getBadge() != null ? p.getBadge().name() : null;
        return r;
    }
}
