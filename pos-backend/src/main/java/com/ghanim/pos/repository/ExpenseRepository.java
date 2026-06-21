package com.ghanim.pos.repository;

import com.ghanim.pos.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByExpenseDateOrderByCreatedAtDesc(LocalDate date);

    List<Expense> findByExpenseDateBetweenOrderByExpenseDateDescCreatedAtDesc(LocalDate from, LocalDate to);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.expenseDate = :date GROUP BY e.category")
    List<Object[]> sumByCategory(LocalDate date);

    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.expenseDate BETWEEN :from AND :to GROUP BY e.category")
    List<Object[]> sumByCategoryBetween(LocalDate from, LocalDate to);
}
