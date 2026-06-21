package com.ghanim.pos.service;

import com.ghanim.pos.entity.*;
import com.ghanim.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SessionRepository sessionRepository;
    private final ProductRepository productRepository;
    private final ExpenseRepository expenseRepository;
    private final ReturnRepository returnRepository;
    private final ReturnItemRepository returnItemRepository;

    // ── Daily Report ─────────────────────────────────────────────────────────

    public Map<String, Object> getDailyReport(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findCompletedSalesBetween(from, to);

        BigDecimal totalAmount = BigDecimal.ZERO, retailAmount = BigDecimal.ZERO,
                wholesaleAmount = BigDecimal.ZERO, totalProfit = BigDecimal.ZERO,
                cashSales = BigDecimal.ZERO, cardSales = BigDecimal.ZERO, creditSales = BigDecimal.ZERO;

        Map<Long, Map<String, Object>> salespersonMap = new HashMap<>();

        for (Sale sale : sales) {
            totalAmount = totalAmount.add(sale.getTotal());
            if ("RETAIL".equals(sale.getSaleType())) retailAmount = retailAmount.add(sale.getTotal());
            else wholesaleAmount = wholesaleAmount.add(sale.getTotal());
            switch (sale.getPaymentMethod()) {
                case "CASH" -> cashSales = cashSales.add(sale.getTotal());
                case "CARD" -> cardSales = cardSales.add(sale.getTotal());
                case "CREDIT" -> creditSales = creditSales.add(sale.getTotal());
            }
            if (sale.getSalesperson() != null) {
                Long spId = sale.getSalesperson().getId();
                Map<String, Object> spData = salespersonMap.computeIfAbsent(spId, k -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("name", sale.getSalesperson().getName());
                    m.put("salesCount", 0); m.put("totalAmount", BigDecimal.ZERO); m.put("profit", BigDecimal.ZERO);
                    return m;
                });
                spData.put("salesCount", (int) spData.get("salesCount") + 1);
                spData.put("totalAmount", ((BigDecimal) spData.get("totalAmount")).add(sale.getTotal()));
            }
            List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
            for (SaleItem item : items) {
                if (item.getProduct() != null && item.getProduct().getCostPrice() != null) {
                    totalProfit = totalProfit.add(
                        item.getUnitPrice().subtract(item.getProduct().getCostPrice())
                            .multiply(item.getQuantity()).subtract(item.getItemDiscount()));
                }
            }
        }

        // Subtract returns from revenue and profit
        List<Return> dayReturns = returnRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal returnedProfit = BigDecimal.ZERO;
        for (Return r : dayReturns) {
            totalRefunds = totalRefunds.add(r.getRefundAmount());
            for (ReturnItem ri : returnItemRepository.findByReturnRecordId(r.getId())) {
                if (ri.getProduct() != null && ri.getProduct().getCostPrice() != null) {
                    returnedProfit = returnedProfit.add(
                        ri.getUnitPrice().subtract(ri.getProduct().getCostPrice()).multiply(ri.getQuantity()));
                }
            }
        }
        totalAmount = totalAmount.subtract(totalRefunds);
        totalProfit = totalProfit.subtract(returnedProfit);

        Optional<Session> currentSession = sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN");
        BigDecimal openingFloat = currentSession.map(Session::getOpeningFloat).orElse(BigDecimal.ZERO);
        List<CashMovement> movements = currentSession
                .map(s -> cashMovementRepository.findBySessionId(s.getId())).orElse(List.of());
        BigDecimal cashIn = movements.stream().filter(m -> "CASH_IN".equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashOut = movements.stream().filter(m -> "CASH_OUT".equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cashRefunds = movements.stream().filter(m -> "REFUND".equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, BigDecimal> cashOutByReason = movements.stream()
                .filter(m -> "CASH_OUT".equals(m.getType()))
                .collect(Collectors.groupingBy(m -> m.getReason() != null ? m.getReason() : "OTHER",
                        Collectors.reducing(BigDecimal.ZERO, CashMovement::getAmount, BigDecimal::add)));

        BigDecimal margin = totalAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("date", date.toString());
        report.put("totalSales", sales.size());
        report.put("totalAmount", totalAmount);
        report.put("totalRefunds", totalRefunds);
        report.put("totalReturns", dayReturns.size());
        report.put("retailAmount", retailAmount);
        report.put("wholesaleAmount", wholesaleAmount);
        BigDecimal totalExpenses = expenseRepository.findByExpenseDateOrderByCreatedAtDesc(date)
                .stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netProfit = totalProfit.subtract(totalExpenses);

        report.put("totalProfit", totalProfit);
        report.put("totalExpenses", totalExpenses);
        report.put("netProfit", netProfit);
        report.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
        report.put("salespersonBreakdown", new ArrayList<>(salespersonMap.values()));
        Map<String, Object> cashSummary = new LinkedHashMap<>();
        cashSummary.put("openingFloat", openingFloat);
        cashSummary.put("totalCashSales", cashSales);
        cashSummary.put("cashIn", cashIn);
        cashSummary.put("cashOut", cashOut);
        cashSummary.put("cashRefunds", cashRefunds);
        cashSummary.put("expectedCash", openingFloat.add(cashSales).add(cashIn).subtract(cashOut).subtract(cashRefunds));
        cashSummary.put("cashOutByReason", cashOutByReason);
        report.put("cashSummary", cashSummary);
        report.put("paymentBreakdown", Map.of("cash", cashSales, "card", cardSales, "credit", creditSales));
        return report;
    }

    // ── Range Report ─────────────────────────────────────────────────────────

    public Map<String, Object> getRangeReport(LocalDate from, LocalDate to) {
        LocalDateTime dtFrom = from.atStartOfDay();
        LocalDateTime dtTo = to.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findCompletedSalesBetween(dtFrom, dtTo);

        BigDecimal totalAmount = BigDecimal.ZERO, totalProfit = BigDecimal.ZERO,
                cashSales = BigDecimal.ZERO, cardSales = BigDecimal.ZERO, creditSales = BigDecimal.ZERO,
                retailAmount = BigDecimal.ZERO, wholesaleAmount = BigDecimal.ZERO;

        for (Sale sale : sales) {
            totalAmount = totalAmount.add(sale.getTotal());
            if ("RETAIL".equals(sale.getSaleType())) retailAmount = retailAmount.add(sale.getTotal());
            else wholesaleAmount = wholesaleAmount.add(sale.getTotal());
            switch (sale.getPaymentMethod()) {
                case "CASH" -> cashSales = cashSales.add(sale.getTotal());
                case "CARD" -> cardSales = cardSales.add(sale.getTotal());
                case "CREDIT" -> creditSales = creditSales.add(sale.getTotal());
            }
        }

        // Profit via items
        for (Sale sale : sales) {
            List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
            for (SaleItem item : items) {
                if (item.getProduct() != null && item.getProduct().getCostPrice() != null) {
                    totalProfit = totalProfit.add(
                        item.getUnitPrice().subtract(item.getProduct().getCostPrice())
                            .multiply(item.getQuantity()).subtract(item.getItemDiscount()));
                }
            }
        }

        // Subtract returns from revenue and profit
        List<Return> rangeReturns = returnRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(dtFrom, dtTo);
        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal returnedProfit = BigDecimal.ZERO;
        for (Return r : rangeReturns) {
            totalRefunds = totalRefunds.add(r.getRefundAmount());
            for (ReturnItem ri : returnItemRepository.findByReturnRecordId(r.getId())) {
                if (ri.getProduct() != null && ri.getProduct().getCostPrice() != null) {
                    returnedProfit = returnedProfit.add(
                        ri.getUnitPrice().subtract(ri.getProduct().getCostPrice()).multiply(ri.getQuantity()));
                }
            }
        }
        totalAmount = totalAmount.subtract(totalRefunds);
        totalProfit = totalProfit.subtract(returnedProfit);

        BigDecimal margin = totalAmount.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(totalAmount, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        // Daily breakdown
        List<Object[]> dailyRows = saleRepository.dailySalesBetween(dtFrom, dtTo);
        List<Map<String, Object>> dailyBreakdown = dailyRows.stream().map(row -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("date", row[0].toString());
            d.put("salesCount", ((Number) row[1]).intValue());
            d.put("revenue", row[2]);
            return d;
        }).toList();

        // Salesperson breakdown
        List<Object[]> spRows = saleRepository.salespersonSalesBetween(dtFrom, dtTo);
        List<Map<String, Object>> spBreakdown = spRows.stream().map(row -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("id", row[0]);
            d.put("name", row[1]);
            d.put("salesCount", ((Number) row[2]).intValue());
            d.put("totalAmount", row[3]);
            return d;
        }).toList();

        Map<String, Object> report = new LinkedHashMap<>();
        report.put("from", from.toString());
        report.put("to", to.toString());
        report.put("totalSales", sales.size());
        report.put("totalAmount", totalAmount);
        report.put("retailAmount", retailAmount);
        report.put("wholesaleAmount", wholesaleAmount);
        BigDecimal rangeExpenses = expenseRepository
                .findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(from, to)
                .stream().map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        report.put("totalRefunds", totalRefunds);
        report.put("totalReturns", rangeReturns.size());
        report.put("totalProfit", totalProfit);
        report.put("totalExpenses", rangeExpenses);
        report.put("netProfit", totalProfit.subtract(rangeExpenses));
        report.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
        report.put("dailyBreakdown", dailyBreakdown);
        report.put("salespersonBreakdown", spBreakdown);
        report.put("paymentBreakdown", Map.of("cash", cashSales, "card", cardSales, "credit", creditSales));
        return report;
    }

    // ── Product Report ───────────────────────────────────────────────────────

    public List<Map<String, Object>> getProductReport(LocalDate from, LocalDate to) {
        List<Object[]> rows = saleItemRepository.productSalesSummary(
                from.atStartOfDay(), to.atTime(23, 59, 59));
        return rows.stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", row[0]);
            m.put("productName", row[1]);
            m.put("category", row[2]);
            m.put("qtySold", row[3]);
            m.put("revenue", row[4]);
            m.put("profit", row[5]);
            BigDecimal revenue = row[4] != null ? (BigDecimal) row[4] : BigDecimal.ZERO;
            BigDecimal profit = row[5] != null ? (BigDecimal) row[5] : BigDecimal.ZERO;
            BigDecimal margin = revenue.compareTo(BigDecimal.ZERO) > 0
                    ? profit.divide(revenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            m.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
            return m;
        }).collect(Collectors.toList());
    }

    // ── Slow Moving Stock ────────────────────────────────────────────────────

    public List<Map<String, Object>> getSlowMovingStock(int days) {
        LocalDate to = LocalDate.now();
        LocalDate from = to.minusDays(days);
        LocalDateTime dtFrom = from.atStartOfDay();
        LocalDateTime dtTo = to.atTime(23, 59, 59);

        List<Object[]> sold = saleItemRepository.productSalesSummary(dtFrom, dtTo);
        Map<Long, BigDecimal> soldQtyMap = sold.stream()
                .collect(Collectors.toMap(r -> (Long) r[0], r -> (BigDecimal) r[3]));

        List<Product> allProducts = productRepository.findAllActiveWithStock();

        return allProducts.stream().map(p -> {
            BigDecimal qtySold = soldQtyMap.getOrDefault(p.getId(), BigDecimal.ZERO);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", p.getId());
            m.put("productName", p.getName());
            m.put("category", p.getCategory() != null ? p.getCategory().getName() : "Uncategorized");
            m.put("stockQuantity", p.getShopStock());
            m.put("qtySoldInPeriod", qtySold);
            m.put("minStockAlert", p.getMinStockAlert());
            return m;
        }).sorted(Comparator.comparing(m -> ((BigDecimal) m.get("qtySoldInPeriod"))))
         .collect(Collectors.toList());
    }

    // ── Cash Flow Report ─────────────────────────────────────────────────────

    public List<Map<String, Object>> getCashFlowReport(LocalDate from, LocalDate to) {
        List<Map<String, Object>> result = new ArrayList<>();
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            LocalDateTime dayStart = cursor.atStartOfDay();
            LocalDateTime dayEnd = cursor.atTime(23, 59, 59);

            List<Sale> daySales = saleRepository.findCompletedSalesBetween(dayStart, dayEnd);
            BigDecimal revenue = daySales.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal cashRevenue = daySales.stream()
                    .filter(s -> "CASH".equals(s.getPaymentMethod()))
                    .map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);

            List<com.ghanim.pos.entity.Expense> expenses = expenseRepository.findByExpenseDateOrderByCreatedAtDesc(cursor);
            BigDecimal totalExpenses = expenses.stream()
                    .map(com.ghanim.pos.entity.Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", cursor.toString());
            day.put("salesCount", daySales.size());
            day.put("revenue", revenue);
            day.put("cashRevenue", cashRevenue);
            day.put("expenses", totalExpenses);
            day.put("net", cashRevenue.subtract(totalExpenses));
            result.add(day);
            cursor = cursor.plusDays(1);
        }
        return result;
    }
}
