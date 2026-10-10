
package com.gouthami.student_expense_tracker;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseRepository expenseRepository;

    public ExpenseController(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    // Add a new expense
    @PostMapping
    public Expense addExpense(@Valid @RequestBody Expense expense) {
        return expenseRepository.save(expense);
    }

    // Get all expenses
    @GetMapping
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    // Delete an expense
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        if (!expenseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        expenseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Update an existing expense
    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody Expense updatedExpense) {

        return expenseRepository.findById(id)
                .map(expense -> {
                    expense.setAmount(updatedExpense.getAmount());
                    expense.setCategory(updatedExpense.getCategory());
                    expense.setDescription(updatedExpense.getDescription());
                    expense.setExpenseDate(updatedExpense.getExpenseDate());

                    Expense savedExpense = expenseRepository.save(expense);
                    return ResponseEntity.ok(savedExpense);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
