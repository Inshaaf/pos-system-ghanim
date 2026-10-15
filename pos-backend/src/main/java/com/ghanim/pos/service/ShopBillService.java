package com.ghanim.pos.service;

import com.ghanim.pos.entity.CashMovement;
import com.ghanim.pos.entity.Salesperson;
import com.ghanim.pos.entity.Session;
import com.ghanim.pos.entity.ShopBill;
import com.ghanim.pos.entity.ShopBillActivity;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.CashMovementRepository;
import com.ghanim.pos.repository.SalespersonRepository;
import com.ghanim.pos.repository.SessionRepository;
import com.ghanim.pos.repository.ShopBillActivityRepository;
import com.ghanim.pos.repository.ShopBillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ShopBillService {
    private final ShopBillRepository billRepository;
    private final ShopBillActivityRepository activityRepository;
    private final SalespersonRepository salespersonRepository;
    private final SessionRepository sessionRepository;
    private final CashMovementRepository cashMovementRepository;

    public List<ShopBill> getBills() {
        List<ShopBill> bills = billRepository.findAllByOrderByCreatedAtDesc();
        java.util.Set<Long> pendingBillIds = new java.util.HashSet<>(activityRepository.findBillIdsWithPendingPayments());
        bills.forEach(bill -> bill.setPaymentAwaitingConfirmation(pendingBillIds.contains(bill.getId())));
        return bills;
    }
    public List<ShopBill> getPending() { return billRepository.findByStatusOrderByCreatedAtDesc("PENDING_APPROVAL"); }
    public List<ShopBillActivity> getPendingPayments() {
        return activityRepository.findByTypeAndConfirmationStatusOrderByCreatedAtDesc("PAYMENT", "PENDING_CONFIRMATION");
    }
    public List<ShopBillActivity> getActivities(Long billId) {
        getBill(billId);
        return activityRepository.findByBillIdOrderByCreatedAtDesc(billId);
    }
    public List<ShopBillActivity> getFollowUps() { return activityRepository.findOpenBillFollowUps(); }

    @Transactional
    public ShopBill create(Map<String, Object> body, String username, boolean owner) {
        String customerName = requiredText(body, "customerName");
        String billNumber = requiredText(body, "billNumber");
        String category = requiredText(body, "category").toUpperCase();
        String billType = requiredText(body, "billType").toUpperCase();
        if (!List.of("RAINCO", "PLASTIC").contains(category)) throw new IllegalArgumentException("Choose Rainco or Plastic");
        if (!List.of("CASH", "CREDIT").contains(billType)) throw new IllegalArgumentException("Choose Cash or Credit");
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));
        if (amount.signum() <= 0) throw new IllegalArgumentException("Bill amount must be greater than zero");
        return billRepository.save(ShopBill.builder()
                .customerName(customerName).billNumber(billNumber).category(category).billType(billType)
                .amount(amount).paidAmount(BigDecimal.ZERO).requestedBy(username)
                .status(owner ? "OPEN" : "PENDING_APPROVAL").reviewedBy(owner ? username : null)
                .reviewedAt(owner ? LocalDateTime.now() : null).build());
    }

    @Transactional
    public ShopBill review(Long id, String username, boolean approve) {
        ShopBill bill = getBill(id);
        if (!"PENDING_APPROVAL".equals(bill.getStatus())) throw new IllegalArgumentException("This bill request was already reviewed");
        bill.setStatus(approve ? "OPEN" : "REJECTED");
        bill.setReviewedBy(username);
        bill.setReviewedAt(LocalDateTime.now());
        return billRepository.save(bill);
    }

    @Transactional
    public ShopBill assign(Long billId, Long salespersonId, boolean owner) {
        ShopBill bill = getBill(billId);
        ensureOpen(bill);
        if (salespersonId == null) {
            if (!owner) throw new IllegalArgumentException("Cashiers must add a follow-up or submit a payment before unassigning a bill");
            bill.setSalesperson(null);
            return billRepository.save(bill);
        }
        Salesperson salesperson = salespersonRepository.findById(salespersonId)
                .orElseThrow(() -> new ResourceNotFoundException("Salesperson not found"));
        if (!salesperson.isActiveForCollection()) throw new IllegalArgumentException("This salesperson is not active for collection");
        bill.setSalesperson(salesperson);
        return billRepository.save(bill);
    }

    @Transactional
    public ShopBillActivity payment(Long billId, Map<String, Object> body, String username, boolean owner) {
        ShopBill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop bill not found"));
        ensureOpen(bill);
        BigDecimal amount = new BigDecimal(String.valueOf(body.get("amount")));
        String method = requiredText(body, "paymentMethod").toUpperCase();
        if (!List.of("CASH", "CHEQUE").contains(method)) throw new IllegalArgumentException("Choose Cash or Cheque");
        if (amount.signum() <= 0 || amount.compareTo(bill.getRemainingAmount()) > 0)
            throw new IllegalArgumentException("Payment must be positive and no greater than the remaining bill balance");
        if (activityRepository.existsByBillIdAndTypeAndConfirmationStatus(billId, "PAYMENT", "PENDING_CONFIRMATION"))
            throw new IllegalArgumentException("A payment for this bill is already awaiting owner confirmation");
        return createPayment(bill, amount, method, username, owner);
    }

    @Transactional
    public ShopBillActivity reviewPayment(Long activityId, String username, boolean approve, String reviewNote) {
        ShopBillActivity activity = activityRepository.findPendingPaymentById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending collection payment not found"));
        ShopBill bill = billRepository.findByIdForUpdate(activity.getBill().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Shop bill not found"));
        if (approve) {
            ensureOpen(bill);
            if (activity.getAmount().compareTo(bill.getRemainingAmount()) > 0)
                throw new IllegalArgumentException("This payment is now greater than the bill's remaining balance");
            bill.setPaidAmount(bill.getPaidAmount().add(activity.getAmount()));
            if (bill.getRemainingAmount().signum() == 0) bill.setStatus("COMPLETED");
            billRepository.save(bill);
            recordCashMovement(activity, bill);
            activity.setConfirmationStatus("CONFIRMED");
        } else {
            activity.setConfirmationStatus("REJECTED");
        }
        activity.setReviewedBy(username);
        activity.setReviewedAt(LocalDateTime.now(java.time.ZoneId.of("Asia/Colombo")));
        activity.setReviewNote(reviewNote);
        return activityRepository.save(activity);
    }

    @Transactional
    public ShopBill unassign(Long billId, Map<String, Object> body, String username, boolean owner) {
        ShopBill bill = billRepository.findByIdForUpdate(billId)
                .orElseThrow(() -> new ResourceNotFoundException("Shop bill not found"));
        ensureOpen(bill);
        if (bill.getSalesperson() == null) throw new IllegalArgumentException("This bill is already unassigned");

        String reason = body.get("reason") == null ? "" : String.valueOf(body.get("reason")).trim();
        Object amountValue = body.get("amount");
        boolean hasAmount = amountValue != null && !String.valueOf(amountValue).isBlank();
        boolean hasMethod = body.get("paymentMethod") != null && !String.valueOf(body.get("paymentMethod")).isBlank();
        if (hasAmount != hasMethod) throw new IllegalArgumentException("Enter both a payment amount and payment method");
        if (!owner && reason.isBlank() && !hasAmount)
            throw new IllegalArgumentException("Add a follow-up reason or submit a payment before unassigning");

        if (hasAmount) {
            BigDecimal amount = new BigDecimal(String.valueOf(amountValue));
            String method = String.valueOf(body.get("paymentMethod")).toUpperCase();
            if (!List.of("CASH", "CHEQUE").contains(method)) throw new IllegalArgumentException("Choose Cash or Cheque");
            if (activityRepository.existsByBillIdAndTypeAndConfirmationStatus(billId, "PAYMENT", "PENDING_CONFIRMATION"))
                throw new IllegalArgumentException("A payment for this bill is already awaiting owner confirmation");
            if (amount.signum() <= 0 || amount.compareTo(bill.getRemainingAmount()) > 0)
                throw new IllegalArgumentException("Payment must be positive and no greater than the remaining bill balance");
            createPayment(bill, amount, method, username, owner);
        }
        if (!reason.isBlank()) {
            Object scheduled = body.get("followUpAt");
            LocalDateTime followUpAt = scheduled == null || String.valueOf(scheduled).isBlank()
                    ? null : LocalDateTime.parse(String.valueOf(scheduled));
            activityRepository.save(ShopBillActivity.builder().bill(bill).type("FOLLOW_UP")
                    .reason(reason).followUpAt(followUpAt).recordedBy(username).build());
        }
        bill.setSalesperson(null);
        return billRepository.save(bill);
    }

    private ShopBillActivity createPayment(ShopBill bill, BigDecimal amount, String method, String username, boolean owner) {
        ShopBillActivity activity = activityRepository.save(ShopBillActivity.builder()
                .bill(bill).type("PAYMENT").amount(amount).paymentMethod(method).recordedBy(username)
                .confirmationStatus(owner ? "CONFIRMED" : "PENDING_CONFIRMATION")
                .reviewedBy(owner ? username : null)
                .reviewedAt(owner ? LocalDateTime.now(java.time.ZoneId.of("Asia/Colombo")) : null).build());
        if (owner) {
            bill.setPaidAmount(bill.getPaidAmount().add(amount));
            if (bill.getRemainingAmount().signum() == 0) bill.setStatus("COMPLETED");
            billRepository.save(bill);
            recordCashMovement(activity, bill);
        }
        return activity;
    }

    private void recordCashMovement(ShopBillActivity activity, ShopBill bill) {
        if (!"CASH".equals(activity.getPaymentMethod())) return;
        Session session = sessionRepository.findFirstByStatusOrderByOpenedAtDesc("OPEN").orElse(null);
        cashMovementRepository.save(CashMovement.builder().session(session).type("CASH_IN").amount(activity.getAmount())
                .reason("CUSTOMER_COLLECTION").notes("Shop bill " + bill.getBillNumber() + " — " + bill.getCustomerName())
                .referenceId(activity.getId()).build());
    }

    @Transactional
    public ShopBillActivity followUp(Long billId, Map<String, Object> body, String username) {
        ShopBill bill = getBill(billId);
        ensureOpen(bill);
        String reason = requiredText(body, "reason");
        Object scheduled = body.get("followUpAt");
        LocalDateTime followUpAt = scheduled == null || String.valueOf(scheduled).isBlank()
                ? null : LocalDateTime.parse(String.valueOf(scheduled));
        return activityRepository.save(ShopBillActivity.builder().bill(bill).type("FOLLOW_UP")
                .reason(reason).followUpAt(followUpAt).recordedBy(username).build());
    }

    private ShopBill getBill(Long id) {
        return billRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shop bill not found"));
    }
    private void ensureOpen(ShopBill bill) {
        if (!"OPEN".equals(bill.getStatus())) throw new IllegalArgumentException("Only approved, incomplete bills can be updated");
    }
    private String requiredText(Map<String, Object> body, String key) {
        Object value = body.get(key);
        if (value == null || String.valueOf(value).isBlank()) throw new IllegalArgumentException(key + " is required");
        return String.valueOf(value).trim();
    }
}
