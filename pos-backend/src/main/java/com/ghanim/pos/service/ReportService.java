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
    private final QuickSaleRepository quickSaleRepository;
    private final QuickSaleItemRepository quickSaleItemRepository;

    // ── Daily Report ─────────────────────────────────────────────────────────

    public Map<String, Object> getDailyReport(LocalDate date) {
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.atTime(23, 59, 59);

        List<Sale> sales = saleRepository.findCompletedSalesBetween(from, to);

        BigDecimal totalAmount = BigDecimal.ZERO, retailAmount = BigDecimal.ZERO,
                wholesaleAmount = BigDecimal.ZERO, totalProfit = BigDecimal.ZERO,
                costedProductRevenue = BigDecimal.ZERO,
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
            List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
            totalProfit = totalProfit.add(regularSaleProfit(sale, items));
            costedProductRevenue = costedProductRevenue.add(regularSaleCostedRevenue(sale, items));
        }

        for (QuickSale quickSale : quickSaleRepository.findByCreatedAtBetweenAndStatusNotOrderByCreatedAtDesc(from, to, "CANCELLED")) {
            totalProfit = totalProfit.add(quickSaleProfit(quickSale));
            costedProductRevenue = costedProductRevenue.add(quickSaleCostedRevenue(quickSale));
        }

        // Include credit sales in salesperson totals even though they are not yet completed/paid.
        for (Sale sale : saleRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to)) {
            if (sale.getSalesperson() == null || "CANCELLED".equals(sale.getStatus())) continue;
            Long spId = sale.getSalesperson().getId();
            Map<String, Object> spData = salespersonMap.computeIfAbsent(spId, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", spId);
                m.put("name", sale.getSalesperson().getName());
                m.put("salesCount", 0);
                m.put("totalAmount", BigDecimal.ZERO);
                m.put("profit", BigDecimal.ZERO);
                return m;
            });
            spData.put("salesCount", (int) spData.get("salesCount") + 1);
            spData.put("totalAmount", ((BigDecimal) spData.get("totalAmount")).add(sale.getTotal()));
        }

        for (QuickSale quickSale : quickSaleRepository.findByCreatedAtBetweenAndStatusNotOrderByCreatedAtDesc(from, to, "CANCELLED")) {
            if (quickSale.getSalesperson() == null) continue;
            Long spId = quickSale.getSalesperson().getId();
            Map<String, Object> spData = salespersonMap.computeIfAbsent(spId, k -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", spId);
                m.put("name", quickSale.getSalesperson().getName());
                m.put("salesCount", 0);
                m.put("totalAmount", BigDecimal.ZERO);
                m.put("profit", BigDecimal.ZERO);
                return m;
            });
            spData.put("salesCount", (int) spData.get("salesCount") + 1);
            spData.put("totalAmount", ((BigDecimal) spData.get("totalAmount")).add(quickSale.getTotal()));
        }

        // Subtract returns from revenue and profit
        List<Return> dayReturns = returnRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal returnedProfit = BigDecimal.ZERO;
        BigDecimal returnedCostedRevenue = BigDecimal.ZERO;
        for (Return r : dayReturns) {
            totalRefunds = totalRefunds.add(r.getRefundAmount());
            for (ReturnItem ri : returnItemRepository.findByReturnRecordId(r.getId())) {
                if (hasKnownCost(ri.getCostPriceSnapshot())) {
                    returnedProfit = returnedProfit.add(
                        ri.getUnitPrice().subtract(ri.getCostPriceSnapshot()).multiply(ri.getQuantity()));
                    returnedCostedRevenue = returnedCostedRevenue.add(ri.getUnitPrice().multiply(ri.getQuantity()));
                }
            }
        }
        totalAmount = totalAmount.subtract(totalRefunds);
        totalProfit = totalProfit.subtract(returnedProfit).setScale(2, RoundingMode.HALF_UP);
        costedProductRevenue = costedProductRevenue.subtract(returnedCostedRevenue);

        BigDecimal openingFloat = sessionRepository.findAllByOrderByOpenedAtDesc().stream()
                .filter(s -> s.getOpenedAt() != null && s.getOpenedAt().toLocalDate().equals(date))
                .map(s -> s.getOpeningFloat() != null ? s.getOpeningFloat() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<CashMovement> movements = cashMovementRepository.findByCreatedAtBetween(from, to);
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

        BigDecimal margin = costedProductRevenue.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(costedProductRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
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
        BigDecimal cashExpenses = expenseRepository.findByExpenseDateAndCashMovementIdIsNull(date).stream()
                .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netProfit = totalProfit.subtract(totalExpenses);

        BigDecimal quickSaleTotal = quickSaleRepository.sumTotalBetween(from, to);
        BigDecimal quickSaleCash = quickSaleRepository.sumCashBetween(from, to);
        long quickSaleCount = quickSaleRepository.countByCreatedAtBetweenAndStatusNot(from, to, "CANCELLED");

        report.put("totalProfit", totalProfit);
        report.put("totalExpenses", totalExpenses);
        report.put("netProfit", netProfit);
        report.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
        report.put("quickSaleCount", quickSaleCount);
        report.put("quickSaleTotal", quickSaleTotal);
        report.put("salespersonBreakdown", new ArrayList<>(salespersonMap.values()));
        Map<String, Object> cashSummary = new LinkedHashMap<>();
        cashSummary.put("openingFloat", openingFloat);
        cashSummary.put("totalCashSales", cashSales);
        cashSummary.put("quickSaleCash", quickSaleCash);
        cashSummary.put("cashIn", cashIn);
        cashSummary.put("cashOut", cashOut);
        cashSummary.put("cashRefunds", cashRefunds);
        cashSummary.put("cashExpenses", cashExpenses);
        cashSummary.put("expectedCash", openingFloat.add(cashSales).add(quickSaleCash).add(cashIn)
                .subtract(cashOut).subtract(cashRefunds).subtract(cashExpenses));
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
                costedProductRevenue = BigDecimal.ZERO,
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

        // Profit from sale-line cost snapshots; lines without known cost are excluded.
        for (Sale sale : sales) {
            List<SaleItem> items = saleItemRepository.findBySaleId(sale.getId());
            totalProfit = totalProfit.add(regularSaleProfit(sale, items));
            costedProductRevenue = costedProductRevenue.add(regularSaleCostedRevenue(sale, items));
        }
        for (QuickSale quickSale : quickSaleRepository.findByCreatedAtBetweenAndStatusNotOrderByCreatedAtDesc(dtFrom, dtTo, "CANCELLED")) {
            totalProfit = totalProfit.add(quickSaleProfit(quickSale));
            costedProductRevenue = costedProductRevenue.add(quickSaleCostedRevenue(quickSale));
        }

        // Subtract returns from revenue and profit
        List<Return> rangeReturns = returnRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(dtFrom, dtTo);
        BigDecimal totalRefunds = BigDecimal.ZERO;
        BigDecimal returnedProfit = BigDecimal.ZERO;
        BigDecimal returnedCostedRevenue = BigDecimal.ZERO;
        for (Return r : rangeReturns) {
            totalRefunds = totalRefunds.add(r.getRefundAmount());
            for (ReturnItem ri : returnItemRepository.findByReturnRecordId(r.getId())) {
                if (hasKnownCost(ri.getCostPriceSnapshot())) {
                    returnedProfit = returnedProfit.add(
                        ri.getUnitPrice().subtract(ri.getCostPriceSnapshot()).multiply(ri.getQuantity()));
                    returnedCostedRevenue = returnedCostedRevenue.add(ri.getUnitPrice().multiply(ri.getQuantity()));
                }
            }
        }
        totalAmount = totalAmount.subtract(totalRefunds);
        totalProfit = totalProfit.subtract(returnedProfit).setScale(2, RoundingMode.HALF_UP);
        costedProductRevenue = costedProductRevenue.subtract(returnedCostedRevenue);

        BigDecimal margin = costedProductRevenue.compareTo(BigDecimal.ZERO) > 0
                ? totalProfit.divide(costedProductRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
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
        Map<Long, Map<String, Object>> salespersonTotals = new HashMap<>();
        List<Object[]> spRows = saleRepository.salespersonSalesBetween(dtFrom, dtTo);
        for (Object[] row : spRows) {
            Long spId = ((Number) row[0]).longValue();
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", spId);
            data.put("name", row[1]);
            data.put("salesCount", ((Number) row[2]).intValue());
            data.put("totalAmount", row[3]);
            salespersonTotals.put(spId, data);
        }
        for (QuickSale quickSale : quickSaleRepository.findByCreatedAtBetweenAndStatusNotOrderByCreatedAtDesc(dtFrom, dtTo, "CANCELLED")) {
            if (quickSale.getSalesperson() == null) continue;
            Long spId = quickSale.getSalesperson().getId();
            Map<String, Object> data = salespersonTotals.computeIfAbsent(spId, id -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", id);
                entry.put("name", quickSale.getSalesperson().getName());
                entry.put("salesCount", 0);
                entry.put("totalAmount", BigDecimal.ZERO);
                return entry;
            });
            data.put("salesCount", (int) data.get("salesCount") + 1);
            data.put("totalAmount", ((BigDecimal) data.get("totalAmount")).add(quickSale.getTotal()));
        }
        List<Map<String, Object>> spBreakdown = salespersonTotals.values().stream()
                .sorted((a, b) -> ((BigDecimal) b.get("totalAmount")).compareTo((BigDecimal) a.get("totalAmount")))
                .toList();

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

    public List<Map<String, Object>> getSalespersonReport(LocalDate from, LocalDate to) {
        LocalDateTime dtFrom = from.atStartOfDay();
        LocalDateTime dtTo = to.atTime(23, 59, 59);
        Map<Long, Map<String, Object>> totals = new HashMap<>();

        for (Object[] row : saleRepository.salespersonSalesBetween(dtFrom, dtTo)) {
            Long id = ((Number) row[0]).longValue();
            Map<String, Object> data = totals.computeIfAbsent(id, key -> newSalespersonReportRow(id, String.valueOf(row[1])));
            data.put("salesCount", ((Number) row[2]).longValue());
            data.put("salesTotal", row[3]);
        }

        for (Object[] row : quickSaleRepository.salespersonQuickSalesBetween(dtFrom, dtTo)) {
            Long id = ((Number) row[0]).longValue();
            Map<String, Object> data = totals.computeIfAbsent(id, key -> newSalespersonReportRow(id, String.valueOf(row[1])));
            data.put("quickSalesCount", ((Number) row[2]).longValue());
            data.put("quickSalesTotal", row[3]);
        }

        return totals.values().stream().peek(data -> {
            long regularCount = ((Number) data.get("salesCount")).longValue();
            long quickCount = ((Number) data.get("quickSalesCount")).longValue();
            BigDecimal regularTotal = (BigDecimal) data.get("salesTotal");
            BigDecimal quickTotal = (BigDecimal) data.get("quickSalesTotal");
            data.put("totalSalesCount", regularCount + quickCount);
            data.put("totalAmount", regularTotal.add(quickTotal));
        }).sorted((a, b) -> ((BigDecimal) b.get("totalAmount")).compareTo((BigDecimal) a.get("totalAmount")))
                .toList();
    }

    private Map<String, Object> newSalespersonReportRow(Long id, String name) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", id);
        row.put("name", name);
        row.put("salesCount", 0L);
        row.put("salesTotal", BigDecimal.ZERO);
        row.put("quickSalesCount", 0L);
        row.put("quickSalesTotal", BigDecimal.ZERO);
        return row;
    }

    // ── Product Report ───────────────────────────────────────────────────────

    public List<Map<String, Object>> getProductReport(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(23, 59, 59);
        Map<Long, Map<String, Object>> byProduct = new LinkedHashMap<>();
        for (Object[] row : saleItemRepository.productSalesSummary(start, end)) {
            Long productId = ((Number) row[0]).longValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("productId", productId);
            m.put("productName", row[1]);
            m.put("category", row[2]);
            m.put("qtySold", row[3]);
            m.put("revenue", row[4]);
            m.put("costedRevenue", row[5] != null ? row[5] : BigDecimal.ZERO);
            m.put("profit", row[6] != null ? row[6] : BigDecimal.ZERO);
            byProduct.put(productId, m);
        }
        for (Object[] row : quickSaleItemRepository.posProductSalesSummary(start, end)) {
            Long productId = ((Number) row[0]).longValue();
            Map<String, Object> m = byProduct.computeIfAbsent(productId, id -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("productId", id);
                item.put("productName", row[1]);
                item.put("category", row[2]);
                item.put("qtySold", BigDecimal.ZERO);
                item.put("revenue", BigDecimal.ZERO);
                item.put("costedRevenue", BigDecimal.ZERO);
                item.put("profit", BigDecimal.ZERO);
                return item;
            });
            m.put("qtySold", ((BigDecimal) m.get("qtySold")).add((BigDecimal) row[3]));
            m.put("revenue", ((BigDecimal) m.get("revenue")).add((BigDecimal) row[4]));
            m.put("costedRevenue", ((BigDecimal) m.get("costedRevenue")).add((BigDecimal) row[5]));
            m.put("profit", ((BigDecimal) m.get("profit")).add(row[6] != null ? (BigDecimal) row[6] : BigDecimal.ZERO));
        }
        for (Object[] row : returnItemRepository.productReturnsBetween(start, end)) {
            Long productId = ((Number) row[0]).longValue();
            Map<String, Object> m = byProduct.computeIfAbsent(productId, id -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("productId", id);
                item.put("productName", row[1]);
                item.put("category", row[2]);
                item.put("qtySold", BigDecimal.ZERO);
                item.put("revenue", BigDecimal.ZERO);
                item.put("costedRevenue", BigDecimal.ZERO);
                item.put("profit", BigDecimal.ZERO);
                return item;
            });
            m.put("qtySold", ((BigDecimal) m.get("qtySold")).subtract((BigDecimal) row[3]));
            m.put("revenue", ((BigDecimal) m.get("revenue")).subtract((BigDecimal) row[4]));
            m.put("costedRevenue", ((BigDecimal) m.get("costedRevenue")).subtract((BigDecimal) row[5]));
            m.put("profit", ((BigDecimal) m.get("profit")).subtract(row[6] != null ? (BigDecimal) row[6] : BigDecimal.ZERO));
        }
        return byProduct.values().stream().map(m -> {
            BigDecimal revenue = (BigDecimal) m.get("revenue");
            BigDecimal costedRevenue = (BigDecimal) m.get("costedRevenue");
            BigDecimal profit = (BigDecimal) m.get("profit");
            BigDecimal margin = costedRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? profit.divide(costedRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
                    : BigDecimal.ZERO;
            m.remove("costedRevenue");
            m.put("margin", margin.setScale(1, RoundingMode.HALF_UP));
            return m;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getManualItemReport(LocalDate from, LocalDate to) {
        List<Object[]> rows = quickSaleItemRepository.manualItemSalesBetween(
                from.atStartOfDay(), to.atTime(23, 59, 59));
        return rows.stream().map(row -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("productName", row[0]);
            item.put("qtySold", row[1]);
            item.put("revenue", row[2]);
            return item;
        }).toList();
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

            BigDecimal quickSaleCash = quickSaleRepository.sumCashBetween(dayStart, dayEnd);
            long quickSaleCount = quickSaleRepository.countByCreatedAtBetweenAndStatusNot(dayStart, dayEnd, "CANCELLED");
            List<CashMovement> movements = cashMovementRepository.findByCreatedAtBetween(dayStart, dayEnd);
            BigDecimal cashIn = sumMovements(movements, "CASH_IN");
            BigDecimal cashOut = sumMovements(movements, "CASH_OUT");
            BigDecimal cashRefunds = sumMovements(movements, "REFUND");

            List<com.ghanim.pos.entity.Expense> expenses = expenseRepository.findByExpenseDateOrderByCreatedAtDesc(cursor);
            BigDecimal totalExpenses = expenses.stream()
                    .map(com.ghanim.pos.entity.Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal unlinkedExpenses = expenseRepository.findByExpenseDateAndCashMovementIdIsNull(cursor).stream()
                    .map(Expense::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("date", cursor.toString());
            day.put("salesCount", daySales.size());
            day.put("quickSaleCount", quickSaleCount);
            day.put("revenue", revenue);
            day.put("cashRevenue", cashRevenue);
            day.put("quickSaleCash", quickSaleCash);
            day.put("cashIn", cashIn);
            day.put("cashOut", cashOut);
            day.put("cashRefunds", cashRefunds);
            day.put("expenses", totalExpenses);
            day.put("net", cashRevenue.add(quickSaleCash).add(cashIn)
                    .subtract(cashOut).subtract(cashRefunds).subtract(unlinkedExpenses));
            result.add(day);
            cursor = cursor.plusDays(1);
        }
        return result;
    }

    public List<Map<String, Object>> getCashMovementDetails(LocalDate from, LocalDate to, String type) {
        if (!"CASH_IN".equals(type) && !"CASH_OUT".equals(type)) {
            throw new IllegalArgumentException("Movement type must be CASH_IN or CASH_OUT");
        }
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay().minusNanos(1);
        return cashMovementRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(start, end).stream()
                .filter(movement -> type.equals(movement.getType()))
                .map(movement -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", movement.getId());
                    row.put("amount", movement.getAmount());
                    row.put("reason", movement.getReason());
                    row.put("notes", movement.getNotes());
                    row.put("createdAt", movement.getCreatedAt());
                    row.put("sessionId", movement.getSession() == null ? null : movement.getSession().getId());
                    return row;
                }).collect(Collectors.toList());
    }

    private BigDecimal sumMovements(List<CashMovement> movements, String type) {
        return movements.stream().filter(m -> type.equals(m.getType()))
                .map(CashMovement::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal regularSaleProfit(Sale sale, List<SaleItem> items) {
        BigDecimal saleLineRevenue = items.stream()
                .map(item -> item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cartDiscount = sale.getCartDiscount() != null ? sale.getCartDiscount() : BigDecimal.ZERO;
        BigDecimal profit = BigDecimal.ZERO;
        for (SaleItem item : items) {
            BigDecimal cost = item.getCostPriceSnapshot();
            if (!hasKnownCost(cost)) continue;
            BigDecimal itemDiscount = item.getItemDiscount() != null ? item.getItemDiscount() : BigDecimal.ZERO;
            BigDecimal lineRevenue = item.getSubtotal() != null ? item.getSubtotal()
                    : item.getUnitPrice().multiply(item.getQuantity()).subtract(itemDiscount);
            BigDecimal cartDiscountShare = BigDecimal.ZERO;
            if (cartDiscount.signum() > 0 && saleLineRevenue.signum() > 0) {
                cartDiscountShare = cartDiscount.multiply(lineRevenue)
                        .divide(saleLineRevenue, 10, RoundingMode.HALF_UP);
            }
            profit = profit.add(item.getUnitPrice().subtract(cost).multiply(item.getQuantity())
                    .subtract(itemDiscount).subtract(cartDiscountShare));
        }
        return profit;
    }

    private BigDecimal regularSaleCostedRevenue(Sale sale, List<SaleItem> items) {
        BigDecimal saleLineRevenue = items.stream()
                .map(item -> item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cartDiscount = sale.getCartDiscount() != null ? sale.getCartDiscount() : BigDecimal.ZERO;
        BigDecimal revenue = BigDecimal.ZERO;
        for (SaleItem item : items) {
            if (!hasKnownCost(item.getCostPriceSnapshot())) continue;
            BigDecimal lineRevenue = item.getSubtotal() != null ? item.getSubtotal()
                    : item.getUnitPrice().multiply(item.getQuantity());
            BigDecimal cartDiscountShare = cartDiscount.signum() > 0 && saleLineRevenue.signum() > 0
                    ? cartDiscount.multiply(lineRevenue).divide(saleLineRevenue, 10, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            revenue = revenue.add(lineRevenue.subtract(cartDiscountShare));
        }
        return revenue;
    }

    private BigDecimal quickSaleProfit(QuickSale sale) {
        BigDecimal profit = BigDecimal.ZERO;
        for (QuickSaleItem item : sale.getItems()) {
            // Manual Quick Sale lines have no POS product ID and never contribute profit.
            if (item.getProductId() == null || !hasKnownCost(item.getCostPriceSnapshot())) continue;
            profit = profit.add(item.getUnitPrice().subtract(item.getCostPriceSnapshot()).multiply(item.getQuantity()));
        }
        return profit;
    }

    private BigDecimal quickSaleCostedRevenue(QuickSale sale) {
        return sale.getItems().stream()
                .filter(item -> item.getProductId() != null && hasKnownCost(item.getCostPriceSnapshot()))
                .map(QuickSaleItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean hasKnownCost(BigDecimal costPrice) {
        return costPrice != null && costPrice.compareTo(BigDecimal.ZERO) > 0;
    }
}
