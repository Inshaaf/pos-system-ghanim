package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CashMovementRequest {
    @NotNull
    private Long sessionId;
    @NotNull
    @Positive
    private BigDecimal amount;
    private String reason;
    private String notes;
    private Long supplierId;
    private Long loanId;
    private String loanPersonName;
    private String loanPhoneNumber;
}
