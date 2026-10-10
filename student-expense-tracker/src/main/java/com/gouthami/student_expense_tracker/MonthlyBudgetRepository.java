
package com.gouthami.student_expense_tracker;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MonthlyBudgetRepository
        extends JpaRepository<MonthlyBudget, Long> {

    Optional<MonthlyBudget> findByMonth(String month);
}
