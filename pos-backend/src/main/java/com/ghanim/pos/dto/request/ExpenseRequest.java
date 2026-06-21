package com.ghanim.pos.dto.request;

import com.ghanim.pos.entity.Expense;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    private Expense.Category category;
    private BigDecimal amount;
    private String note;
    private Long supplierId;
    private Long salespersonId;
    private LocalDate expenseDate;
}
