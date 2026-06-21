package com.ghanim.pos.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ReturnRequest {
    private Long originalSaleId;   // null for direct returns
    @NotNull
    private Long sessionId;
    private Long salespersonId;    // optional
    @NotNull
    private String returnType; // CASH_REFUND, EXCHANGE
    @NotEmpty
    private List<ReturnItemRequest> items;
    private String reason;

    @Data
    public static class ReturnItemRequest {
        @NotNull
        private Long productId;
        @NotNull
        private BigDecimal quantity;
        @NotNull
        private BigDecimal unitPrice;
    }
}
