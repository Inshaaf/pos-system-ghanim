package com.ghanim.pos.service;

import com.ghanim.pos.entity.ShopSupply;
import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.entity.SupplierDelivery;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ShopSupplyRepository;
import com.ghanim.pos.repository.SupplierDeliveryRepository;
import com.ghanim.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierDeliveryService {

    private final SupplierDeliveryRepository deliveryRepo;
    private final SupplierRepository supplierRepo;
    private final ShopSupplyRepository supplyRepo;

    @Transactional
    public SupplierDelivery create(Map<String, Object> body) {
        Long supplierId = Long.valueOf(body.get("supplierId").toString());
        BigDecimal quantity  = new BigDecimal(body.get("quantity").toString());
        BigDecimal unitPrice = new BigDecimal(body.get("unitPrice").toString());
        BigDecimal amount    = quantity.multiply(unitPrice);
        String note      = body.containsKey("note") ? (String) body.get("note") : null;
        String createdBy = body.containsKey("createdBy") ? (String) body.get("createdBy") : null;
        LocalDate deliveredAt = body.containsKey("deliveredAt") && body.get("deliveredAt") != null
                ? LocalDate.parse(body.get("deliveredAt").toString())
                : LocalDate.now();

        Supplier supplier = supplierRepo.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        ShopSupply supplyItem = null;
        if (body.containsKey("supplyItemId") && body.get("supplyItemId") != null) {
            Long itemId = Long.valueOf(body.get("supplyItemId").toString());
            supplyItem = supplyRepo.findById(itemId)
                    .orElseThrow(() -> new ResourceNotFoundException("Supply item not found: " + itemId));
        }

        supplier.setBalance(supplier.getBalance().add(amount));
        supplierRepo.save(supplier);

        return deliveryRepo.save(SupplierDelivery.builder()
                .supplier(supplier)
                .supplyItem(supplyItem)
                .quantity(quantity)
                .unitPrice(unitPrice)
                .amount(amount)
                .note(note)
                .deliveredAt(deliveredAt)
                .createdBy(createdBy)
                .build());
    }

    public List<SupplierDelivery> getBySupplier(Long supplierId) {
        return deliveryRepo.findBySupplierIdOrderByDeliveredAtDescCreatedAtDesc(supplierId);
    }

    public List<Map<String, Object>> getPriceComparison() {
        List<Object[]> rows = deliveryRepo.findPriceComparison();
        return buildPriceRows(rows);
    }

    @Transactional
    public void delete(Long id) {
        SupplierDelivery d = deliveryRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found: " + id));
        Supplier supplier = d.getSupplier();
        supplier.setBalance(supplier.getBalance().subtract(d.getAmount()));
        supplierRepo.save(supplier);
        deliveryRepo.delete(d);
    }

    private List<Map<String, Object>> buildPriceRows(List<Object[]> rows) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new HashMap<>();
            m.put("supplyItemId",   r[0]);
            m.put("supplyItemName", r[1]);
            m.put("supplierId",     r[2]);
            m.put("supplierName",   r[3]);
            m.put("avgPrice",       r[4]);
            m.put("minPrice",       r[5]);
            m.put("maxPrice",       r[6]);
            m.put("lastDelivery",   r[7]);
            result.add(m);
        }
        return result;
    }
}
