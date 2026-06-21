package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.ExpenseRequest;
import com.ghanim.pos.entity.Expense;
import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ExpenseRepository;
import com.ghanim.pos.repository.SalespersonRepository;
import com.ghanim.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final SupplierRepository supplierRepository;
    private final SalespersonRepository salespersonRepository;

    @Transactional
    public Expense create(ExpenseRequest req) {
        Supplier supplier = null;
        if (req.getSupplierId() != null) {
            supplier = supplierRepository.findById(req.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        }

        Salesperson salesperson = null;
        if (req.getSalespersonId() != null) {
            salesperson = salespersonRepository.findById(req.getSalespersonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found"));
        }

        if (req.getCategory() == Expense.Category.SUPPLIER_PAYMENT && supplier != null) {
            supplier.setBalance(supplier.getBalance().subtract(req.getAmount()));
            supplierRepository.save(supplier);
        }

        Expense expense = Expense.builder()
                .category(req.getCategory())
                .amount(req.getAmount())
                .note(req.getNote())
                .supplier(supplier)
                .salesperson(salesperson)
                .expenseDate(req.getExpenseDate() != null ? req.getExpenseDate() : LocalDate.now())
                .build();

        return expenseRepository.save(expense);
    }

    public List<Expense> getByDate(LocalDate date) {
        return expenseRepository.findByExpenseDateOrderByCreatedAtDesc(date);
    }

    public List<Expense> getByRange(LocalDate from, LocalDate to) {
        return expenseRepository.findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(from, to);
    }

    public Map<String, Double> getDailySummary(LocalDate date) {
        return expenseRepository.sumByCategory(date).stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> ((Number) row[1]).doubleValue()
                ));
    }

    public Map<String, Double> getMonthlySummary(LocalDate from, LocalDate to) {
        return expenseRepository.sumByCategoryBetween(from, to).stream()
                .collect(Collectors.toMap(
                        row -> row[0].toString(),
                        row -> ((Number) row[1]).doubleValue()
                ));
    }

    @Transactional
    public void addSupplierBalance(Long supplierId, java.math.BigDecimal amount) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        supplier.setBalance(supplier.getBalance().add(amount));
        supplierRepository.save(supplier);
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        if (expense.getCategory() == Expense.Category.SUPPLIER_PAYMENT && expense.getSupplier() != null) {
            Supplier supplier = expense.getSupplier();
            supplier.setBalance(supplier.getBalance().add(expense.getAmount()));
            supplierRepository.save(supplier);
        }

        expenseRepository.delete(expense);
    }
}
