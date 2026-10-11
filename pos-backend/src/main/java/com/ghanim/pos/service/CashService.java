package com.ghanim.pos.service;

import com.ghanim.pos.dto.request.CashMovementRequest;
import com.ghanim.pos.dto.request.ExpenseRequest;
import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.Expense;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CashMovementRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CashService {

    private final CashMovementRepository cashMovementRepository;
    private final SessionRepository sessionRepository;
    private final ExpenseService expenseService;

    public CashMovement cashIn(CashMovementRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        return cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("CASH_IN")
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .build());
    }

    @Transactional
    public CashMovement cashOut(CashMovementRequest request) {
        Session session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        Expense.Category category = expenseCategory(request.getReason());
        if (category == Expense.Category.SUPPLIER_PAYMENT && request.getSupplierId() == null) {
            throw new IllegalArgumentException("Select a supplier for a supplier payment");
        }
        CashMovement movement = cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("CASH_OUT")
                .amount(request.getAmount())
                .reason(request.getReason())
                .notes(request.getNotes())
                .build());
        if (category != null) {
            ExpenseRequest expense = new ExpenseRequest();
            expense.setCategory(category);
            expense.setAmount(request.getAmount());
            expense.setSupplierId(request.getSupplierId());
            expense.setSessionId(session.getId());
            expense.setExpenseDate(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Colombo")));
            expense.setNote("Cash Out — " + request.getReason() +
                    (request.getNotes() == null || request.getNotes().isBlank() ? "" : ": " + request.getNotes()));
            expenseService.createFromCashMovement(expense, movement.getId());
        }
        return movement;
    }

    private Expense.Category expenseCategory(String reason) {
        if (reason == null) throw new IllegalArgumentException("Select a cash out reason");
        return switch (reason) {
            case "CHARITY" -> Expense.Category.CHARITY;
            case "SHOP_EXPENSE" -> Expense.Category.SHOP_EXPENSE;
            case "TRANSPORT" -> Expense.Category.TRANSPORT;
            case "CLEANING" -> Expense.Category.CLEANING;
            case "FOOD" -> Expense.Category.FOOD;
            case "SUPPLIER" -> Expense.Category.SUPPLIER_PAYMENT;
            case "OTHER" -> Expense.Category.OTHER;
            case "OWNER_WITHDRAWAL", "CASH_TRANSFER" -> null;
            default -> throw new IllegalArgumentException("Unsupported cash out reason");
        };
    }

    public List<CashMovement> getMovements(Long sessionId) {
        return cashMovementRepository.findBySessionId(sessionId);
    }
}
