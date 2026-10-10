
package com.gouthami.student_expense_tracker;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/budgets")
@Validated
public class BudgetController {

    private final MonthlyBudgetRepository budgetRepository;

    public BudgetController(MonthlyBudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    // Get the budget for a particular month
    @GetMapping("/{month}")
    public ResponseEntity<?> getBudget(@PathVariable String month) {

        if (!isValidMonth(month)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Month must be in YYYY-MM format."
                    ));
        }

        return budgetRepository.findByMonth(month)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Save or update a monthly budget
    @PutMapping("/{month}")
    public ResponseEntity<?> saveBudget(
            @PathVariable String month,
            @Valid @RequestBody MonthlyBudget budget) {

        if (!isValidMonth(month)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Month must be in YYYY-MM format."
                    ));
        }

        if (budget.getAmount() == null ||
                budget.getAmount().signum() <= 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Budget must be greater than zero."
                    ));
        }

        MonthlyBudget existing = budgetRepository.findByMonth(month)
                .orElseGet(MonthlyBudget::new);

        existing.setMonth(month);
        existing.setAmount(budget.getAmount());

        return ResponseEntity.ok(budgetRepository.save(existing));
    }

    // Validate month format
    private boolean isValidMonth(String month) {
        return month != null &&
                month.matches("\\d{4}-(0[1-9]|1[0-2])");
    }
}
