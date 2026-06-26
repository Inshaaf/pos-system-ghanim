package com.ghanim.pos.service;

import com.ghanim.pos.entity.*;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuickSaleService {

    private final QuickSaleRepository quickSaleRepository;
    private final SalespersonRepository salespersonRepository;
    private final ProductRepository productRepository;
    private final StockService stockService;

    @Transactional
    public Map<String, Object> create(Map<String, Object> request) {
        Object spIdRaw = request.get("salespersonId");
        if (spIdRaw == null) throw new IllegalArgumentException("salespersonId is required");
        Long salespersonId = Long.valueOf(spIdRaw.toString());
        String paymentMethod = request.getOrDefault("paymentMethod", "CASH").toString();
        Object totalRaw = request.get("total");
        if (totalRaw == null) throw new IllegalArgumentException("total is required");
        BigDecimal total = new BigDecimal(totalRaw.toString());
        Object notesRaw = request.get("notes");
        String notes = notesRaw != null ? notesRaw.toString() : null;

        Object cashRaw = request.get("cashTendered");
        BigDecimal cashTendered = cashRaw != null ? new BigDecimal(cashRaw.toString()) : null;
        BigDecimal changeAmount = cashTendered != null ? cashTendered.subtract(total) : null;

        Salesperson salesperson = salespersonRepository.findById(salespersonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found"));

        QuickSale sale = QuickSale.builder()
                .salesperson(salesperson)
                .total(total)
                .paymentMethod(paymentMethod)
                .cashTendered(cashTendered)
                .changeAmount(changeAmount)
                .notes(notes)
                .build();

        sale = quickSaleRepository.save(sale);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsRaw = (List<Map<String, Object>>) request.getOrDefault("items", List.of());

        for (Map<String, Object> itemRaw : itemsRaw) {
            Long productId = itemRaw.get("productId") != null
                    ? Long.valueOf(itemRaw.get("productId").toString()) : null;
            String name = itemRaw.get("name").toString();
            BigDecimal qty = new BigDecimal(itemRaw.get("quantity").toString());
            BigDecimal unitPrice = new BigDecimal(itemRaw.get("unitPrice").toString());
            BigDecimal subtotal = qty.multiply(unitPrice);

            QuickSaleItem item = QuickSaleItem.builder()
                    .quickSale(sale)
                    .productId(productId)
                    .name(name)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .subtotal(subtotal)
                    .build();

            sale.getItems().add(item);

            // Deduct stock for POS products — no profit recorded
            if (productId != null) {
                Product product = productRepository.findById(productId).orElse(null);
                if (product != null) {
                    stockService.deductShopStock(product, qty);
                }
            }
        }

        quickSaleRepository.save(sale);

        return toDetail(sale);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByDate(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to   = date.atTime(23, 59, 59);
        return quickSaleRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to)
                .stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getById(Long id) {
        QuickSale sale = quickSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quick sale not found: " + id));
        return toDetail(sale);
    }

    private Map<String, Object> toSummary(QuickSale s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("total", s.getTotal());
        m.put("paymentMethod", s.getPaymentMethod());
        m.put("notes", s.getNotes());
        m.put("createdAt", s.getCreatedAt());
        m.put("salesperson", s.getSalesperson() != null
                ? Map.of("id", s.getSalesperson().getId(), "name", s.getSalesperson().getName())
                : null);
        return m;
    }

    private Map<String, Object> toDetail(QuickSale s) {
        Map<String, Object> m = toSummary(s);
        m.put("cashTendered", s.getCashTendered());
        m.put("changeAmount", s.getChangeAmount());
        m.put("items", s.getItems().stream().map(i -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", i.getName());
            item.put("quantity", i.getQuantity());
            item.put("unitPrice", i.getUnitPrice());
            item.put("subtotal", i.getSubtotal());
            item.put("productId", i.getProductId());
            return item;
        }).toList());
        return m;
    }
}
