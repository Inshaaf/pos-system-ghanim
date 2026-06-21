package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.CheckoutRequest;
import com.ghanim.pos.entity.*;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final SessionRepository sessionRepository;
    private final SalespersonRepository salespersonRepository;
    private final ProductRepository productRepository;
    private final CashMovementRepository cashMovementRepository;
    private final StockService stockService;

    @Transactional
    public Map<String, Object> checkout(CheckoutRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        Salesperson salesperson = salespersonRepository.findById(request.getSalespersonId())
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found"));

        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalItemDiscount = BigDecimal.ZERO;

        for (CheckoutRequest.CartItemRequest item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            BigDecimal itemSubtotal = item.getUnitPrice().multiply(item.getQuantity());
            BigDecimal itemDiscount = item.getItemDiscount() != null ? item.getItemDiscount() : BigDecimal.ZERO;

            if (item.getItemDiscountPct() != null && item.getItemDiscountPct().compareTo(BigDecimal.ZERO) > 0) {
                itemDiscount = itemSubtotal.multiply(item.getItemDiscountPct()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }

            BigDecimal lineTotal = itemSubtotal.subtract(itemDiscount);

            saleItems.add(SaleItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .barcode(product.getBarcode())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .priceType(item.getPriceType())
                    .itemDiscount(itemDiscount)
                    .itemDiscountPct(item.getItemDiscountPct() != null ? item.getItemDiscountPct() : BigDecimal.ZERO)
                    .subtotal(lineTotal)
                    .build());

            subtotal = subtotal.add(lineTotal);
            totalItemDiscount = totalItemDiscount.add(itemDiscount);
        }

        BigDecimal cartDiscountPct = request.getCartDiscountPct() != null ? request.getCartDiscountPct() : BigDecimal.ZERO;
        BigDecimal cartDiscount = subtotal.multiply(cartDiscountPct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.subtract(cartDiscount);

        BigDecimal changeAmount = BigDecimal.ZERO;
        if ("CASH".equals(request.getPaymentMethod()) && request.getCashTendered() != null) {
            changeAmount = request.getCashTendered().subtract(total);
            if (changeAmount.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Cash tendered is less than total");
            }
        }

        String saleStatus = "CREDIT".equals(request.getPaymentMethod()) ? "CREDIT" : "COMPLETED";

        Sale sale = Sale.builder()
                .session(session)
                .salesperson(salesperson)
                .saleType(request.getSaleType())
                .customerName(request.getCustomerName())
                .subtotal(subtotal.add(totalItemDiscount)) // gross subtotal before discounts
                .itemDiscount(totalItemDiscount)
                .cartDiscount(cartDiscount)
                .cartDiscountPct(cartDiscountPct)
                .total(total)
                .paymentMethod(request.getPaymentMethod())
                .cashTendered(request.getCashTendered())
                .changeAmount(changeAmount)
                .notes(request.getNotes())
                .status(saleStatus)
                .build();

        sale = saleRepository.save(sale);

        for (SaleItem item : saleItems) {
            item.setSale(sale);
        }
        saleItemRepository.saveAll(saleItems);

        // Deduct stock and record cash movement
        for (int i = 0; i < saleItems.size(); i++) {
            SaleItem item = saleItems.get(i);
            stockService.deductShopStock(item.getProduct(), item.getQuantity());
        }

        if ("CASH".equals(request.getPaymentMethod())) {
            cashMovementRepository.save(CashMovement.builder()
                    .session(session)
                    .type("SALE")
                    .amount(total)
                    .reason("Sale #" + sale.getId())
                    .referenceId(sale.getId())
                    .build());
        }

        // Build receipt
        Map<String, Object> receipt = buildReceipt(sale, saleItems, salesperson);

        Map<String, Object> result = new HashMap<>();
        result.put("saleId", sale.getId());
        result.put("total", total);
        result.put("changeAmount", changeAmount);
        result.put("receipt", receipt);
        return result;
    }

    public Sale getById(Long id) {
        return saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + id));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSaleDetail(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + id));
        List<SaleItem> items = sale.getItems(); // trigger lazy load inside transaction
        return buildFullDetail(sale, items);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByDate(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to   = date.atTime(23, 59, 59);
        return saleRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to)
                .stream().map(s -> buildSummary(s)).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCredits() {
        return saleRepository.findByStatusOrderByCreatedAtDesc("CREDIT")
                .stream().map(s -> buildSummary(s)).toList();
    }

    @Transactional
    public void recordPayment(Long id, BigDecimal amount) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + id));
        if (!"CREDIT".equals(sale.getStatus())) {
            throw new IllegalArgumentException("Sale is not a pending credit");
        }
        sale.setStatus("COMPLETED");
        sale.setCashTendered(amount);
        sale.setChangeAmount(amount.subtract(sale.getTotal()));
        saleRepository.save(sale);

        cashMovementRepository.save(CashMovement.builder()
                .session(sale.getSession())
                .type("CREDIT_PAYMENT")
                .amount(amount)
                .reason("Credit payment for Sale #" + id + " — " + (sale.getCustomerName() != null ? sale.getCustomerName() : ""))
                .referenceId(id)
                .build());
    }

    private Map<String, Object> buildSummary(Sale s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("saleType", s.getSaleType());
        m.put("customerName", s.getCustomerName());
        m.put("paymentMethod", s.getPaymentMethod());
        m.put("total", s.getTotal());
        m.put("status", s.getStatus());
        m.put("createdAt", s.getCreatedAt());
        m.put("salesperson", s.getSalesperson() != null ? Map.of("name", s.getSalesperson().getName()) : null);
        return m;
    }

    private Map<String, Object> buildFullDetail(Sale sale, List<SaleItem> items) {
        Map<String, Object> m = buildSummary(sale);
        m.put("subtotal", sale.getSubtotal());
        m.put("itemDiscount", sale.getItemDiscount());
        m.put("cartDiscount", sale.getCartDiscount());
        m.put("cashTendered", sale.getCashTendered());
        m.put("changeAmount", sale.getChangeAmount());
        m.put("notes", sale.getNotes());
        m.put("items", items.stream().map(i -> {
            Map<String, Object> item = new HashMap<>();
            item.put("id", i.getId());
            item.put("productId", i.getProduct() != null ? i.getProduct().getId() : null);
            item.put("name", i.getProductName());
            item.put("productName", i.getProductName());
            item.put("quantity", i.getQuantity());
            item.put("unitPrice", i.getUnitPrice());
            item.put("discount", i.getItemDiscount());
            item.put("subtotal", i.getSubtotal());
            return item;
        }).toList());
        return m;
    }

    @org.springframework.beans.factory.annotation.Value("${pos.manager.pin:1234}")
    private String managerPin;

    @Transactional
    public void cancelSale(Long id, String pin, String reason) {
        if (!managerPin.equals(pin)) {
            throw new IllegalArgumentException("Incorrect manager PIN");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale not found: " + id));
        if (!"COMPLETED".equals(sale.getStatus())) {
            throw new IllegalArgumentException("Sale cannot be cancelled");
        }
        sale.setStatus("CANCELLED");
        sale.setCancelReason(reason);
        sale.setCancelledAt(java.time.LocalDateTime.now());
        saleRepository.save(sale);
        sale.getItems().forEach(item ->
                stockService.addShopStock(item.getProduct(), item.getQuantity()));
    }

    private Map<String, Object> buildReceipt(Sale sale, List<SaleItem> items, Salesperson salesperson) {
        Map<String, Object> receipt = new HashMap<>();
        receipt.put("saleId", sale.getId());
        receipt.put("date", sale.getCreatedAt());
        receipt.put("salesperson", salesperson.getName());
        receipt.put("saleType", sale.getSaleType());
        receipt.put("customerName", sale.getCustomerName());
        receipt.put("items", items.stream().map(i -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", i.getProductName());
            item.put("quantity", i.getQuantity());
            item.put("unitPrice", i.getUnitPrice());
            item.put("subtotal", i.getSubtotal());
            return item;
        }).toList());
        receipt.put("subtotal", sale.getSubtotal());
        receipt.put("itemDiscount", sale.getItemDiscount());
        receipt.put("cartDiscount", sale.getCartDiscount());
        receipt.put("total", sale.getTotal());
        receipt.put("paymentMethod", sale.getPaymentMethod());
        receipt.put("cashTendered", sale.getCashTendered());
        receipt.put("changeAmount", sale.getChangeAmount());
        return receipt;
    }
}
