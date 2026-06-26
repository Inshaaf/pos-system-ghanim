package com.ghanim.pos.service;

import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CashMovementRepository;
import com.ghanim.pos.repository.QuickSaleRepository;
import com.ghanim.pos.repository.SaleRepository;
import com.ghanim.pos.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final CashMovementRepository cashMovementRepository;
    private final SaleRepository saleRepository;
    private final QuickSaleRepository quickSaleRepository;

    public Optional<Session> getCurrentSession() {
        return sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN");
    }

    @Transactional
    public Session openSession(String cashierName, BigDecimal openingFloat) {
        sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN").ifPresent(s -> {
            throw new IllegalArgumentException("A session is already open");
        });

        Session session = Session.builder()
                .cashierName(cashierName)
                .openingFloat(openingFloat)
                .status("OPEN")
                .build();
        session = sessionRepository.save(session);

        cashMovementRepository.save(CashMovement.builder()
                .session(session)
                .type("OPENING")
                .amount(openingFloat)
                .reason("Opening float")
                .build());

        return session;
    }

    @Transactional
    public Map<String, Object> closeSession(Long id, BigDecimal closingCash, String notes) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));

        if (!"OPEN".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not open");
        }

        session.setStatus("CLOSED");
        session.setClosingCash(closingCash);
        session.setNotes(notes);
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);

        BigDecimal totalSales = saleRepository.findBySessionId(id).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()) && "CASH".equals(s.getPaymentMethod()))
                .map(s -> s.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashIn = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_IN".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashOut = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_OUT".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expected = session.getOpeningFloat().add(totalSales).add(cashIn).subtract(cashOut);
        BigDecimal difference = closingCash.subtract(expected);

        Map<String, Object> summary = new HashMap<>();
        summary.put("sessionId", id);
        summary.put("openingFloat", session.getOpeningFloat());
        summary.put("totalCashSales", totalSales);
        summary.put("cashIn", cashIn);
        summary.put("cashOut", cashOut);
        summary.put("expectedCash", expected);
        summary.put("closingCash", closingCash);
        summary.put("difference", difference);
        summary.put("closedAt", session.getClosedAt());
        return summary;
    }

    // Cashier submits their blind count — no financial details returned
    @Transactional
    public void submitCount(Long id, BigDecimal closingCash, String notes) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));
        if (!"OPEN".equals(session.getStatus())) {
            throw new IllegalArgumentException("Session is not open");
        }
        session.setClosingCash(closingCash);
        session.setNotes(notes);
        session.setStatus("CLOSED");
        session.setClosedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    // Owner sees full reconciliation for a single session
    public Map<String, Object> getReconciliation(Long id) {
        Session session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + id));
        return buildReconciliation(session);
    }

    // Owner list — all sessions with reconciliation snapshot
    public List<Map<String, Object>> getAllWithReconciliation() {
        List<Session> sessions = sessionRepository.findAllByOrderByOpenedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Session s : sessions) {
            result.add(buildReconciliation(s));
        }
        return result;
    }

    private Map<String, Object> buildReconciliation(Session session) {
        Long id = session.getId();

        BigDecimal cashSales = saleRepository.findBySessionId(id).stream()
                .filter(s -> "COMPLETED".equals(s.getStatus()) && "CASH".equals(s.getPaymentMethod()))
                .map(s -> s.getTotal())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashIn = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_IN".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashOut = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "CASH_OUT".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal cashRefunds = cashMovementRepository.findBySessionId(id).stream()
                .filter(m -> "REFUND".equals(m.getType()))
                .map(CashMovement::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime sessionFrom = session.getOpenedAt();
        LocalDateTime sessionTo = session.getClosedAt() != null ? session.getClosedAt() : LocalDateTime.now();
        BigDecimal quickSaleCash = quickSaleRepository.sumCashBetween(sessionFrom, sessionTo);

        BigDecimal opening = session.getOpeningFloat() != null ? session.getOpeningFloat() : BigDecimal.ZERO;
        BigDecimal expected = opening.add(cashSales).add(quickSaleCash).add(cashIn).subtract(cashOut).subtract(cashRefunds);
        BigDecimal difference = session.getClosingCash() != null
                ? session.getClosingCash().subtract(expected)
                : null;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("cashierName", session.getCashierName());
        m.put("status", session.getStatus());
        m.put("openedAt", session.getOpenedAt());
        m.put("closedAt", session.getClosedAt());
        m.put("openingFloat", opening);
        m.put("cashSales", cashSales);
        m.put("quickSaleCash", quickSaleCash);
        m.put("cashIn", cashIn);
        m.put("cashOut", cashOut);
        m.put("cashRefunds", cashRefunds);
        m.put("expectedCash", expected);
        m.put("closingCash", session.getClosingCash());
        m.put("difference", difference);
        m.put("notes", session.getNotes());
        return m;
    }
}
