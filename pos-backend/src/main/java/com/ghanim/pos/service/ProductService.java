package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.ProductRequest;
import com.ghanim.pos.dto.response.ProductResponse;
import com.ghanim.pos.entity.*;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final StockLocationRepository stockLocationRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getPosProducts(String search, Long categoryId) {
        List<Product> products;
        boolean hasSearch = search != null && !search.isBlank();
        if (hasSearch && categoryId != null) {
            products = productRepository.searchProductsByCategory(search, categoryId);
        } else if (hasSearch) {
            products = productRepository.searchProducts(search);
        } else if (categoryId != null) {
            products = productRepository.findByCategoryAndShowInPos(categoryId);
        } else {
            products = productRepository.findByShowInPosTrueAndActiveTrue();
        }
        return products.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toResponse(p);
    }

    @Transactional(readOnly = true)
    public ProductResponse getByBarcode(String barcode) {
        Product p = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with barcode: " + barcode));
        return toResponse(p);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .retailPrice(request.getRetailPrice())
                .wholesalePrice(request.getWholesalePrice())
                .costPrice(request.getCostPrice())
                .shopCode(request.getShopCode() != null ? request.getShopCode().toUpperCase() : null)
                .barcode(request.getBarcode())
                .unit(request.getUnit())
                .minWholesaleQty(request.getMinWholesaleQty())
                .minStockAlert(request.getMinStockAlert())
                .showOnline(request.isShowOnline())
                .showInPos(request.isShowInPos())
                .onlinePrice(request.getOnlinePrice() != null ? request.getOnlinePrice() : request.getRetailPrice())
                .productSource(Product.ProductSource.valueOf(request.getProductSource()))
                .fulfillmentSource(Product.FulfillmentSource.valueOf(request.getFulfillmentSource()))
                .imageUrl(request.getImageUrl())
                .active(true)
                .stock(BigDecimal.ZERO)
                .build();

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getSupplierId() != null) {
            product.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }

        product = productRepository.save(product);

        // Create SHOP stock entry
        BigDecimal initial = request.getInitialStock() != null ? request.getInitialStock() : BigDecimal.ZERO;
        stockLocationRepository.save(StockLocation.builder()
                .product(product)
                .location("SHOP")
                .quantity(initial)
                .build());

        return toResponse(product);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setRetailPrice(request.getRetailPrice());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setCostPrice(request.getCostPrice());
        product.setShopCode(request.getShopCode() != null ? request.getShopCode().toUpperCase() : null);
        product.setBarcode(request.getBarcode());
        product.setUnit(request.getUnit());
        product.setMinWholesaleQty(request.getMinWholesaleQty());
        product.setMinStockAlert(request.getMinStockAlert());
        product.setShowOnline(request.isShowOnline());
        product.setShowInPos(request.isShowInPos());
        product.setProductSource(Product.ProductSource.valueOf(request.getProductSource()));
        product.setFulfillmentSource(Product.FulfillmentSource.valueOf(request.getFulfillmentSource()));
        if (request.getOnlinePrice() != null) product.setOnlinePrice(request.getOnlinePrice());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getSupplierId() != null) {
            product.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }

        return toResponse(productRepository.save(product));
    }

    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal shopStock = stockLocationRepository
                .findByProductIdAndLocation(p.getId(), "SHOP")
                .map(StockLocation::getQuantity)
                .orElse(BigDecimal.ZERO);
        return ProductResponse.from(p, shopStock);
    }
}
