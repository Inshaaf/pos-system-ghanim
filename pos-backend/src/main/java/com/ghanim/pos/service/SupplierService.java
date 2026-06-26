package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.StockReceiveRequest;
import com.ghanim.pos.entity.Product;
import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ProductRepository;
import com.ghanim.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;

    public List<Supplier> getAll() {
        return supplierRepository.findByActiveTrue();
    }

    public List<Supplier> getByType(Supplier.Type type) {
        return supplierRepository.findByActiveTrueAndType(type);
    }

    public Supplier create(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public Supplier update(Long id, Supplier updated) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + id));
        supplier.setName(updated.getName());
        supplier.setCode(updated.getCode());
        supplier.setPhone(updated.getPhone());
        supplier.setAddress(updated.getAddress());
        supplier.setNotes(updated.getNotes());
        supplier.setActive(updated.isActive());
        if (updated.getType() != null) supplier.setType(updated.getType());
        return supplierRepository.save(supplier);
    }

    public List<Product> getProducts(Long supplierId) {
        return productRepository.findBySupplierIdAndActiveTrue(supplierId);
    }

    @Transactional
    public Supplier receiveGoods(Long supplierId, List<Map<String, Object>> items) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        BigDecimal total = BigDecimal.ZERO;
        for (Map<String, Object> item : items) {
            Long productId = Long.valueOf(item.get("productId").toString());
            BigDecimal qty = new BigDecimal(item.get("quantity").toString());
            BigDecimal unitCost = new BigDecimal(item.get("unitCost").toString());

            StockReceiveRequest req = new StockReceiveRequest();
            req.setProductId(productId);
            req.setQuantity(qty);
            req.setCostPrice(unitCost);
            req.setSupplierId(supplierId);
            req.setNotes("Received from " + supplier.getName());
            stockService.receiveStock(req);

            total = total.add(qty.multiply(unitCost));
        }

        supplier.setBalance(supplier.getBalance().add(total));
        return supplierRepository.save(supplier);
    }
}
