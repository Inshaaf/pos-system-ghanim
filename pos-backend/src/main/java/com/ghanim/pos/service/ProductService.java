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
    private final EcommerceSyncService ecommerceSyncService;
    private final ShopCodeService shopCodeService;

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
    public List<ProductResponse> getAllActive(String search) {
        List<Product> products = (search != null && !search.isBlank())
                ? productRepository.searchAllActive(search)
                : productRepository.findByActiveTrue();
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
        String shopCode = request.getShopCode() != null ? request.getShopCode().toUpperCase() : null;
        BigDecimal costPrice = request.getCostPrice();
        if (shopCode != null) {
            BigDecimal decoded = shopCodeService.decode(shopCode);
            if (decoded != null) costPrice = decoded;
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .retailPrice(request.getRetailPrice())
                .wholesalePrice(request.getWholesalePrice())
                .costPrice(costPrice)
                .shopCode(shopCode)
                .labelName(request.getLabelName())
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

        ecommerceSyncService.sync(product, initial);
        return toResponse(product);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        String updatedShopCode = request.getShopCode() != null ? request.getShopCode().toUpperCase() : null;
        BigDecimal updatedCostPrice = request.getCostPrice();
        if (updatedShopCode != null) {
            BigDecimal decoded = shopCodeService.decode(updatedShopCode);
            if (decoded != null) updatedCostPrice = decoded;
        }

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setRetailPrice(request.getRetailPrice());
        product.setWholesalePrice(request.getWholesalePrice());
        product.setCostPrice(updatedCostPrice);
        product.setShopCode(updatedShopCode);
        product.setLabelName(request.getLabelName());
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

        Product saved = productRepository.save(product);
        BigDecimal shopStock = stockLocationRepository
                .findByProductIdAndLocation(saved.getId(), "SHOP")
                .map(StockLocation::getQuantity)
                .orElse(BigDecimal.ZERO);
        ecommerceSyncService.sync(saved, shopStock);
        return toResponse(saved);
    }

    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public String nextBarcode(String prefix) {
        String upper = prefix.toUpperCase();
        List<String> existing = productRepository.findBarcodesByPrefix(upper);
        int max = 0;
        for (String bc : existing) {
            String numPart = bc.substring(upper.length());
            try { max = Math.max(max, Integer.parseInt(numPart)); } catch (NumberFormatException ignored) {}
        }
        int next = max + 1;
        String pad = next < 1000 ? String.format("%03d", next) : String.valueOf(next);
        return upper + pad;
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal shopStock = stockLocationRepository
                .findByProductIdAndLocation(p.getId(), "SHOP")
                .map(StockLocation::getQuantity)
                .orElse(BigDecimal.ZERO);
        return ProductResponse.from(p, shopStock);
    }
}
