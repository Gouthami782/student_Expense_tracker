const API_URL = "/api/expenses";
const BUDGET_API_URL = "/api/budgets";

// Expense form elements
const form = document.getElementById("expenseForm");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const descriptionInput = document.getElementById("description");
const dateInput = document.getElementById("expenseDate");
const expenseList = document.getElementById("expenseList");
const totalElement = document.getElementById("total");
const message = document.getElementById("message");

// Summary elements
const monthFilter = document.getElementById("monthFilter");
const monthlyTotal = document.getElementById("monthlyTotal");
const monthlyMessage = document.getElementById("monthlyMessage");
const categorySummary = document.getElementById("categorySummary");

// Spending alert element
const spendingAlert = document.getElementById("spendingAlert");

// Optional budget elements
const budgetAmountInput = document.getElementById("budgetAmount");
const saveBudgetButton = document.getElementById("saveBudgetButton");
const budgetMessage = document.getElementById("budgetMessage");
const displayBudget = document.getElementById("displayBudget");
const budgetSpent = document.getElementById("budgetSpent");
const budgetRemaining = document.getElementById("budgetRemaining");
const budgetWarning = document.getElementById("budgetWarning");

// Optional search and filter elements
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const clearFiltersButton = document.getElementById("clearFiltersButton");
const filterMessage = document.getElementById("filterMessage");

let allExpenses = [];
let currentBudget = 0;
let currentMonthlySpent = 0;

function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function formatCurrency(amount) {
    return "₹" + Number(amount || 0).toFixed(2);
}

function showMessage(element, text, color = "red") {
    if (!element) return;

    element.textContent = text;
    element.style.color = color;
}

if (dateInput) {
    dateInput.value = getToday();
}

if (monthFilter) {
    monthFilter.value = getToday().slice(0, 7);
}

// Load expenses
async function loadExpenses() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to load expenses.");
        }

        allExpenses = await response.json();
        renderDashboard();
    } catch (error) {
        showMessage(
            message,
            "Unable to load expenses. Check whether the server is running."
        );
    }
}

// Update dashboard summaries
function renderDashboard() {
    const selectedMonth = monthFilter?.value || getToday().slice(0, 7);

    const total = allExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const monthlyExpenses = allExpenses.filter(expense =>
        expense.expenseDate?.startsWith(selectedMonth)
    );

    currentMonthlySpent = monthlyExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    if (totalElement) {
        totalElement.textContent = formatCurrency(total);
    }

    if (monthlyTotal) {
        monthlyTotal.textContent = formatCurrency(currentMonthlySpent);
    }

    if (monthlyMessage) {
        monthlyMessage.textContent =
            `${monthlyExpenses.length} expense(s) in the selected month.`;
    }

    renderCategorySummary();
    renderFilteredExpenses();
    updateBudgetDisplay();
}

// Category-wise spending summary
function renderCategorySummary() {
    if (!categorySummary) return;

    categorySummary.replaceChildren();

    const categoryTotals = {};

    allExpenses.forEach(expense => {
        const category = expense.category || "Other";

        categoryTotals[category] =
            (categoryTotals[category] || 0) +
            Number(expense.amount || 0);
    });

    const total = allExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    const categories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (categories.length === 0) {
        categorySummary.textContent = "No expenses recorded yet.";
        return;
    }

    categories.forEach(([category, amount]) => {
        const percentage = total > 0 ? (amount / total) * 100 : 0;

        const item = document.createElement("div");
        item.className = "category-item";

        const heading = document.createElement("div");
        heading.className = "category-heading";

        const name = document.createElement("span");
        name.textContent = category;

        const value = document.createElement("span");
        value.textContent =
            `${formatCurrency(amount)} (${percentage.toFixed(1)}%)`;

        heading.append(name, value);

        const track = document.createElement("div");
        track.className = "progress-track";

        const bar = document.createElement("div");
        bar.className = "progress-bar";
        bar.style.width = `${percentage}%`;

        track.appendChild(bar);
        item.append(heading, track);
        categorySummary.appendChild(item);
    });
}

// Monthly spending alerts
function updateSpendingAlert() {
    const alertElement = document.getElementById("spendingAlert");

    if (!alertElement) {
        console.error("Spending alert element not found.");
        return;
    }

    if (currentBudget <= 0) {
        alertElement.textContent =
            "Set a monthly budget to receive spending alerts.";
        alertElement.style.color = "#64748b";
        return;
    }

    const percentage = (currentMonthlySpent / currentBudget) * 100;
    const remaining = currentBudget - currentMonthlySpent;

    if (percentage > 100) {
        alertElement.textContent =
            `Budget exceeded by ${formatCurrency(Math.abs(remaining))}. ` +
            "Please review your spending.";
        alertElement.style.color = "#dc2626";
    } else if (percentage >= 80) {
        alertElement.textContent =
            `Warning: You have used ${percentage.toFixed(1)}% of your budget. ` +
            `${formatCurrency(remaining)} remains.`;
        alertElement.style.color = "#d97706";
    } else {
        alertElement.textContent =
            `Your spending is within limits. ` +
            `${percentage.toFixed(1)}% of your budget used.`;
        alertElement.style.color = "#15803d";
    }
}

// Allow testing the alert from the browser console
window.updateSpendingAlert = updateSpendingAlert;
// Search, category and date filters
function renderFilteredExpenses() {
    if (!expenseList) return;

    expenseList.replaceChildren();

    const searchTerm =
        searchInput?.value.trim().toLowerCase() || "";

    const selectedCategory = categoryFilter?.value || "";
    const startDate = startDateInput?.value || "";
    const endDate = endDateInput?.value || "";

    if (startDate && endDate && startDate > endDate) {
        showMessage(
            filterMessage,
            "Start date cannot be later than end date."
        );
        return;
    }

    const filtered = allExpenses.filter(expense => {
        const description =
            (expense.description || "").toLowerCase();

        const matchesSearch = description.includes(searchTerm);

        const matchesCategory =
            !selectedCategory ||
            selectedCategory === "All" ||
            expense.category === selectedCategory;

        const matchesStart =
            !startDate || expense.expenseDate >= startDate;

        const matchesEnd =
            !endDate || expense.expenseDate <= endDate;

        return matchesSearch &&
            matchesCategory &&
            matchesStart &&
            matchesEnd;
    });

    filtered.sort((a, b) =>
        (b.expenseDate || "").localeCompare(a.expenseDate || "")
    );

    if (filtered.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;
        cell.textContent = "No matching expenses found.";

        row.appendChild(cell);
        expenseList.appendChild(row);
    } else {
        filtered.forEach(expense => {
            const row = document.createElement("tr");

            [
                expense.expenseDate,
                expense.category || "Other",
                expense.description || "",
                formatCurrency(expense.amount)
            ].forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "";
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.addEventListener(
                "click",
                () => editExpense(expense)
            );

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener(
                "click",
                () => deleteExpense(expense)
            );

            actionCell.append(editButton, deleteButton);
            row.appendChild(actionCell);
            expenseList.appendChild(row);
        });
    }

    showMessage(
        filterMessage,
        `Showing ${filtered.length} of ${allExpenses.length} expenses.`,
        "#2457a7"
    );
}

// Edit an expense
async function editExpense(expense) {
    const amountText = prompt("Enter amount:", expense.amount);
    if (amountText === null) return;

    const amount = Number(amountText);

    if (
        !amountText.trim() ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Amount must be greater than zero.");
        return;
    }

    const category = prompt("Enter category:", expense.category);
    if (category === null) return;

    if (!category.trim()) {
        alert("Category is required.");
        return;
    }

    const description = prompt(
        "Enter description:",
        expense.description || ""
    );
    if (description === null) return;

    if (description.trim().length > 200) {
        alert("Description cannot exceed 200 characters.");
        return;
    }

    const expenseDate = prompt(
        "Enter date (YYYY-MM-DD):",
        expense.expenseDate
    );
    if (expenseDate === null) return;

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate) ||
        Number.isNaN(Date.parse(expenseDate)) ||
        expenseDate > getToday()
    ) {
        alert("Enter a valid date that is not in the future.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${expense.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                amount,
                category: category.trim(),
                description: description.trim(),
                expenseDate
            })
        });

        if (!response.ok) {
            throw new Error("Update failed");
        }

        showMessage(message, "Expense updated successfully!", "green");

        await loadExpenses();
        await loadMonthlyBudget();
    } catch (error) {
        showMessage(message, "Could not update expense.");
    }
}

// Delete an expense
async function deleteExpense(expense) {
    if (!confirm("Are you sure you want to delete this expense?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${expense.id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            throw new Error("Delete failed");
        }

        showMessage(message, "Expense deleted successfully!", "green");

        await loadExpenses();
        await loadMonthlyBudget();
    } catch (error) {
        showMessage(message, "Could not delete expense.");
    }
}

// Add a new expense
if (form) {
    form.addEventListener("submit", async event => {
        event.preventDefault();

        const amount = Number(amountInput.value);
        const category = categoryInput.value.trim();
        const description = descriptionInput.value.trim();
        const expenseDate = dateInput.value;

        if (
            !amountInput.value.trim() ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showMessage(message, "Amount must be greater than zero.");
            amountInput.focus();
            return;
        }

        if (!category) {
            showMessage(message, "Please select a category.");
            categoryInput.focus();
            return;
        }

        if (!expenseDate) {
            showMessage(message, "Please select an expense date.");
            dateInput.focus();
            return;
        }

        if (expenseDate > getToday()) {
            showMessage(message, "Expense date cannot be in the future.");
            dateInput.focus();
            return;
        }

        if (description.length > 200) {
            showMessage(
                message,
                "Description cannot exceed 200 characters."
            );
            descriptionInput.focus();
            return;
        }

        const submitButton =
            form.querySelector('button[type="submit"]');

        try {
            if (submitButton) submitButton.disabled = true;

            showMessage(message, "Saving expense...", "#2457a7");

            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    category,
                    description,
                    expenseDate
                })
            });

            if (!response.ok) {
                const errorData =
                    await response.json().catch(() => ({}));

                throw new Error(
                    errorData.message ||
                    errorData.detail ||
                    "Unable to save expense. Check your details."
                );
            }

            form.reset();
            dateInput.value = getToday();

            showMessage(
                message,
                "Expense added successfully!",
                "green"
            );

            await loadExpenses();
            await loadMonthlyBudget();
        } catch (error) {
            showMessage(
                message,
                error.message || "Unable to connect to the server."
            );
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}
// Load monthly budget
async function loadMonthlyBudget() {
    if (!monthFilter) return;

    const month = monthFilter.value;
    if (!month) return;

    try {
        const response = await fetch(
            `${BUDGET_API_URL}/${encodeURIComponent(month)}`
        );

        if (response.status === 404) {
            currentBudget = 0;

            if (budgetAmountInput) {
                budgetAmountInput.value = "";
            }

            updateBudgetDisplay();

            showMessage(
                budgetMessage,
                "Set a budget for the selected month.",
                "#2457a7"
            );
            return;
        }

        if (!response.ok) {
            throw new Error("Unable to load budget.");
        }

        const budget = await response.json();
        currentBudget = Number(budget.amount || 0);

        if (budgetAmountInput) {
            budgetAmountInput.value = currentBudget || "";
        }

        updateBudgetDisplay();

        showMessage(
            budgetMessage,
            "Budget loaded successfully.",
            "green"
        );
    } catch (error) {
        showMessage(
            budgetMessage,
            "Unable to load the monthly budget."
        );

        updateSpendingAlert();
    }
}

// Update budget and remaining balance
function updateBudgetDisplay() {
    const month = monthFilter?.value || getToday().slice(0, 7);

    const monthExpenses = allExpenses.filter(expense =>
        expense.expenseDate?.startsWith(month)
    );

    currentMonthlySpent = monthExpenses.reduce(
        (sum, expense) => sum + Number(expense.amount || 0),
        0
    );

    if (displayBudget) {
        displayBudget.textContent = formatCurrency(currentBudget);
    }

    if (budgetSpent) {
        budgetSpent.textContent = formatCurrency(currentMonthlySpent);
    }

    if (budgetRemaining) {
        budgetRemaining.textContent =
            formatCurrency(currentBudget - currentMonthlySpent);
    }

    if (budgetWarning) {
        if (currentBudget > 0 && currentMonthlySpent > currentBudget) {
            budgetWarning.textContent =
                "Warning: You have exceeded your monthly budget!";
            budgetWarning.style.color = "red";
        } else if (currentBudget > 0) {
            budgetWarning.textContent =
                "You are within your monthly budget.";
            budgetWarning.style.color = "green";
        } else {
            budgetWarning.textContent = "";
        }
    }

    // Automatically refresh the spending alert.
    updateSpendingAlert();
}

// Save or update monthly budget
if (saveBudgetButton) {
    saveBudgetButton.addEventListener("click", async () => {
        const rawAmount = budgetAmountInput?.value ?? "";
        const amount = Number(rawAmount);

        if (
            !rawAmount.trim() ||
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            showMessage(
                budgetMessage,
                "Budget must be greater than zero."
            );
            return;
        }

        const month = monthFilter?.value;

        if (!month) {
            showMessage(budgetMessage, "Please select a month.");
            return;
        }

        saveBudgetButton.disabled = true;

        try {
            const response = await fetch(
                `${BUDGET_API_URL}/${encodeURIComponent(month)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ month, amount })
                }
            );

            if (!response.ok) {
                const errorData =
                    await response.json().catch(() => ({}));

                throw new Error(
                    errorData.message ||
                    errorData.detail ||
                    "Unable to save budget."
                );
            }

            const savedBudget = await response.json();
            currentBudget = Number(savedBudget.amount ?? amount);

            updateBudgetDisplay();

            showMessage(
                budgetMessage,
                "Budget saved successfully!",
                "green"
            );
        } catch (error) {
            showMessage(
                budgetMessage,
                error.message || "Unable to connect to the server."
            );
        } finally {
            saveBudgetButton.disabled = false;
        }
    });
}

// Month changes update summaries and budget
if (monthFilter) {
    monthFilter.addEventListener("change", async () => {
        renderDashboard();
        await loadMonthlyBudget();
    });
}

// Search and filter event listeners
[searchInput, categoryFilter, startDateInput, endDateInput]
    .filter(Boolean)
    .forEach(element => {
        element.addEventListener("input", renderFilteredExpenses);
        element.addEventListener("change", renderFilteredExpenses);
    });

// Clear all filters
if (clearFiltersButton) {
    clearFiltersButton.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (categoryFilter) categoryFilter.value = "";
        if (startDateInput) startDateInput.value = "";
        if (endDateInput) endDateInput.value = "";

        renderFilteredExpenses();
    });
}

// Initialize dashboard
async function initializeDashboard() {
    // Load expenses first so spending totals are available.
    await loadExpenses();

    // Then load the budget for the selected month.
    await loadMonthlyBudget();

    // Ensure the alert shows the latest values.
    updateSpendingAlert();
}

initializeDashboard();