
package com.gouthami.student_expense_tracker;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

@Entity
@Table(
        name = "monthly_budgets",
        uniqueConstraints = @UniqueConstraint(columnNames = "month")
)
public class MonthlyBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Pattern(regexp = "\\d{4}-(0[1-9]|1[0-2])",
            message = "Month must be in YYYY-MM format")
    @Column(nullable = false, unique = true)
    private String month;

    @NotNull
    @DecimalMin(value = "0.01",
            message = "Budget must be greater than zero")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    public MonthlyBudget() {
    }

    public Long getId() {
        return id;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
