package com.ghanim.pos.service;

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
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuickSaleService {

    private final QuickSaleRepository quickSaleRepository;
    private final SalespersonRepository salespersonRepository;
    private final ProductRepository productRepository;
    private final ManualProductRepository manualProductRepository;
    private final CustomerRepository customerRepository;
    private final SessionRepository sessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final StockService stockService;
    private final ManagerPinService managerPinService;

    @Transactional
    public Map<String, Object> create(Map<String, Object> request) {
        Object spIdRaw = request.get("salespersonId");
        if (spIdRaw == null) throw new IllegalArgumentException("salespersonId is required");
        Long salespersonId = Long.valueOf(spIdRaw.toString());
        String paymentMethod = request.getOrDefault("paymentMethod", "CASH").toString();
        Customer customer = null;
        Object customerIdRaw = request.get("customerId");
        if ("CREDIT".equals(paymentMethod) && customerIdRaw == null) {
            throw new IllegalArgumentException("Select a saved customer for quick sale credit");
        }
        if (customerIdRaw != null) {
            Long customerId = Long.valueOf(customerIdRaw.toString());
            customer = customerRepository.findById(customerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
            if ("CREDIT".equals(paymentMethod) && !customer.isActive()) {
                throw new IllegalArgumentException("Select an active customer for quick sale credit");
            }
        }
        String customerName = customer != null ? customer.getName()
                : request.get("customerName") != null ? request.get("customerName").toString().trim() : null;
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

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemsRaw = (List<Map<String, Object>>) request.getOrDefault("items", List.of());
        QuickSale sale = QuickSale.builder()
                .salesperson(salesperson)
                .total(total)
                .paymentMethod(paymentMethod)
                .customerName(customerName)
                .customer(customer)
                .status("CREDIT".equals(paymentMethod) ? "CREDIT" : "COMPLETED")
                .cashTendered(cashTendered)
                .changeAmount(changeAmount)
                .notes(notes)
                .createdAt(LocalDateTime.now(ZoneId.of("Asia/Colombo")))
                .build();

        sale = quickSaleRepository.save(sale);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (Map<String, Object> itemRaw : itemsRaw) {
            Long productId = itemRaw.get("productId") != null
                    ? Long.valueOf(itemRaw.get("productId").toString()) : null;
            String name = itemRaw.get("name") != null ? itemRaw.get("name").toString().trim() : "";
            if (name.isBlank()) throw new IllegalArgumentException("Item name is required");
            BigDecimal qty = new BigDecimal(itemRaw.get("quantity").toString());
            if (qty.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Item quantity must be positive");

            ManualProduct manualProduct = null;
            BigDecimal unitPrice;
            if (productId == null) {
                Object manualIdRaw = itemRaw.get("manualProductId");
                if (manualIdRaw != null) {
                    Long manualProductId = Long.valueOf(manualIdRaw.toString());
                    manualProduct = manualProductRepository.findById(manualProductId)
                            .orElseThrow(() -> new ResourceNotFoundException("Manual item not found"));
                    name = manualProduct.getName();
                    unitPrice = itemRaw.get("unitPrice") != null
                            ? new BigDecimal(itemRaw.get("unitPrice").toString())
                            : manualProduct.getUnitPrice();
                    if (unitPrice.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Item price must be positive");
                } else {
                    Object lineTotalRaw = itemRaw.get("lineTotal");
                    BigDecimal lineTotal = lineTotalRaw != null
                            ? new BigDecimal(lineTotalRaw.toString())
                            : new BigDecimal(itemRaw.get("unitPrice").toString()).multiply(qty);
                    if (lineTotal.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("Item price must be positive");
                    unitPrice = lineTotal.divide(qty, 2, RoundingMode.HALF_UP);
                    manualProduct = manualProductRepository.findByNameIgnoreCase(name).orElse(null);
                    if (manualProduct == null) manualProduct = ManualProduct.builder().name(name).build();
                    manualProduct.setActive(true);
                    manualProduct.setUnitPrice(unitPrice);
                    manualProduct = manualProductRepository.save(manualProduct);
                }
            } else {
                unitPrice = new BigDecimal(itemRaw.get("unitPrice").toString());
            }
            Product posProduct = productId == null ? null : productRepository.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
            BigDecimal subtotal = qty.multiply(unitPrice);
            calculatedTotal = calculatedTotal.add(subtotal);

            QuickSaleItem item = QuickSaleItem.builder()
                    .quickSale(sale)
                    .productId(productId)
                    .manualProduct(manualProduct)
                    .name(name)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .costPriceSnapshot(posProduct != null ? posProduct.getCostPrice() : null)
                    .subtotal(subtotal)
                    .build();

            sale.getItems().add(item);

            // Keep POS product cost with this line for profit reporting; manual lines stay costless.
            if (posProduct != null) stockService.deductShopStock(posProduct, qty);
        }

        if (!itemsRaw.isEmpty()) {
            total = calculatedTotal;
            sale.setTotal(total);
            sale.setChangeAmount(cashTendered != null ? cashTendered.subtract(total) : null);
        }

        quickSaleRepository.save(sale);

        return toDetail(sale);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getByDate(LocalDate date, Long salespersonId) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to   = date.atTime(23, 59, 59);
        return quickSaleRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to)
                .stream().filter(s -> salespersonId == null || (s.getSalesperson() != null && salespersonId.equals(s.getSalesperson().getId())))
                .map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getById(Long id) {
        QuickSale sale = quickSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quick sale not found: " + id));
        return toDetail(sale);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCredits() {
        return quickSaleRepository.findByStatusOrderByCreatedAtDesc("CREDIT")
                .stream().map(this::toSummary).toList();
    }

    @Transactional
    public void recordPayment(Long id, BigDecimal amount) {
        QuickSale sale = quickSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quick sale not found: " + id));
        if (!"CREDIT".equals(sale.getStatus())) {
            throw new IllegalArgumentException("Quick sale is not a pending credit");
        }
        if (amount == null || amount.compareTo(sale.getTotal()) < 0) {
            throw new IllegalArgumentException("Payment must cover the outstanding quick sale credit");
        }
        Session paymentSession = sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN")
                .orElseThrow(() -> new IllegalArgumentException("Open a till session before recording a credit payment"));
        sale.setStatus("COMPLETED");
        sale.setCashTendered(amount);
        sale.setChangeAmount(amount.subtract(sale.getTotal()));
        quickSaleRepository.save(sale);
        cashMovementRepository.save(CashMovement.builder()
                .session(paymentSession)
                .type("CREDIT_PAYMENT")
                .amount(sale.getTotal())
                .reason("Credit payment for Quick Sale #" + id + " — " + (sale.getCustomerName() != null ? sale.getCustomerName() : ""))
                .referenceId(id)
                .build());
    }

    @Transactional
    public void cancel(Long id, String pin, String reason) {
        managerPinService.verify(pin);
        cancelAfterApproval(id, reason);
    }

    @Transactional
    public void cancelAfterApproval(Long id, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required");
        }
        QuickSale sale = quickSaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quick sale not found: " + id));
        if (!"COMPLETED".equals(sale.getStatus()) && !"CREDIT".equals(sale.getStatus())) {
            throw new IllegalArgumentException("Quick sale cannot be cancelled");
        }

        sale.setStatus("CANCELLED");
        sale.setCancelReason(reason.trim());
        sale.setCancelledAt(LocalDateTime.now(ZoneId.of("Asia/Colombo")));
        quickSaleRepository.save(sale);

        sale.getItems().stream()
                .filter(item -> item.getProductId() != null)
                .forEach(item -> productRepository.findById(item.getProductId())
                        .ifPresent(product -> stockService.addShopStock(product, item.getQuantity())));
    }

    private Map<String, Object> toSummary(QuickSale s) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", s.getId());
        m.put("total", s.getTotal());
        m.put("paymentMethod", s.getPaymentMethod());
        m.put("customerName", s.getCustomerName());
        m.put("customerId", s.getCustomer() != null ? s.getCustomer().getId() : null);
        m.put("customerPhone", s.getCustomer() != null ? s.getCustomer().getPhone() : null);
        m.put("customerAddress", s.getCustomer() != null ? s.getCustomer().getAddress() : null);
        m.put("status", s.getStatus());
        m.put("cancelReason", s.getCancelReason());
        m.put("cancelledAt", s.getCancelledAt() != null
                ? s.getCancelledAt().atZone(ZoneId.of("Asia/Colombo")).toOffsetDateTime() : null);
        m.put("saleType", "QUICK SALE");
        m.put("quickSale", true);
        m.put("notes", s.getNotes());
        m.put("createdAt", s.getCreatedAt() != null
                ? s.getCreatedAt().atZone(ZoneId.of("Asia/Colombo")).toOffsetDateTime() : null);
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
            item.put("manualProductId", i.getManualProduct() != null ? i.getManualProduct().getId() : null);
            return item;
        }).toList());
        return m;
    }
}
