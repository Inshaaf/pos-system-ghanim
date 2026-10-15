package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.ExpenseRequest;
import com.ghanim.pos.entity.Expense;
import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.entity.Supplier;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ExpenseRepository;
import com.ghanim.pos.repository.SalespersonRepository;
import com.ghanim.pos.repository.SupplierRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final SupplierRepository supplierRepository;
    private final SalespersonRepository salespersonRepository;
    private final SessionRepository sessionRepository;

    @Transactional
    public Expense create(ExpenseRequest req) {
        return create(req, null);
    }

    @Transactional
    public Expense createFromCashMovement(ExpenseRequest req, Long cashMovementId) {
        return create(req, cashMovementId);
    }

    private Expense create(ExpenseRequest req, Long cashMovementId) {
        if (req.getCategory() == null || req.getAmount() == null || req.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("A valid expense category and positive amount are required");
        }
        if (req.getCategory() == Expense.Category.SUPPLIER_PAYMENT && req.getSupplierId() == null) {
            throw new IllegalArgumentException("Select a supplier for a supplier payment");
        }
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

        Long sessionId;
        if (cashMovementId == null) {
            Session openSession = sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN")
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Open a till session before recording an expense so it can be deducted from the till"));
            if (req.getSessionId() != null && !req.getSessionId().equals(openSession.getId())) {
                throw new IllegalArgumentException("Expenses must be recorded against the currently open till session");
            }
            sessionId = openSession.getId();
        } else {
            sessionId = req.getSessionId() != null
                    ? sessionRepository.findById(req.getSessionId())
                        .orElseThrow(() -> new ResourceNotFoundException("Session not found")).getId()
                    : null;
            if (sessionId == null) throw new IllegalArgumentException("Cash out must be linked to a till session");
        }

        Expense expense = Expense.builder()
                .category(req.getCategory())
                .amount(req.getAmount())
                .note(req.getNote())
                .supplier(supplier)
                .salesperson(salesperson)
                .expenseDate(req.getExpenseDate() != null ? req.getExpenseDate() : LocalDate.now(ZoneId.of("Asia/Colombo")))
                .cashMovementId(cashMovementId)
                .sessionId(sessionId)
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

        if (expense.getCashMovementId() != null) {
            throw new IllegalArgumentException("This expense was created from Cash Out and cannot be deleted separately");
        }

        if (expense.getCategory() == Expense.Category.SUPPLIER_PAYMENT && expense.getSupplier() != null) {
            Supplier supplier = expense.getSupplier();
            supplier.setBalance(supplier.getBalance().add(expense.getAmount()));
            supplierRepository.save(supplier);
        }

        expenseRepository.delete(expense);
    }
}
