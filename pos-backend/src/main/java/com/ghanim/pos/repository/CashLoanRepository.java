package com.ghanim.pos.repository;

import com.ghanim.pos.entity.CashLoan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface CashLoanRepository extends JpaRepository<CashLoan, Long> {
    List<CashLoan> findAllByOrderByPersonNameAsc();
    List<CashLoan> findByOutstandingGreaterThanOrderByPersonNameAsc(BigDecimal outstanding);
}
