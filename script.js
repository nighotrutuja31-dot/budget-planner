const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Education",
    "Other"
];

const STORAGE_KEY = "budgetWiseData";

let data = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
) || {
    budgets: {},
    expenses: []
};

let budgetChart;


/* -------------------------
   SAVE DATA
------------------------- */

function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}


/* -------------------------
   FORMAT CURRENCY
------------------------- */

function currency(amount) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount || 0);
}


/* -------------------------
   CURRENT MONTH
------------------------- */

function showCurrentMonth() {

    const now = new Date();

    document.getElementById("currentMonth")
        .textContent =
        now.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );
}


/* -------------------------
   AGGREGATE EXPENSES
   USING REDUCE()
------------------------- */

function getTotalsByCategory() {

    return data.expenses.reduce(
        (totals, expense) => {

            if (!totals[expense.category]) {
                totals[expense.category] = 0;
            }

            totals[expense.category] +=
                Number(expense.amount);

            return totals;

        },
        {}
    );
}


/* -------------------------
   SUMMARY
------------------------- */

function updateSummary() {

    const totalBudget =
        categories.reduce(
            (sum, category) => {

                return sum +
                    Number(
                        data.budgets[category] || 0
                    );

            },
            0
        );

    const totals =
        getTotalsByCategory();

    const totalSpent =
        Object.values(totals).reduce(
            (sum, amount) =>
                sum + amount,
            0
        );

    const remaining =
        totalBudget - totalSpent;

    const overBudget =
        categories.filter(
            category => {

                const budget =
                    Number(
                        data.budgets[category] || 0
                    );

                const spent =
                    Number(
                        totals[category] || 0
                    );

                return budget > 0 &&
                    spent > budget;
            }
        ).length;


    document.getElementById("totalBudget")
        .textContent = currency(totalBudget);

    document.getElementById("totalSpent")
        .textContent = currency(totalSpent);

    document.getElementById("remaining")
        .textContent = currency(remaining);

    document.getElementById("overBudgetCount")
        .textContent = overBudget;


    const remainingElement =
        document.getElementById("remaining");

    remainingElement.style.color =
        remaining < 0
            ? "var(--red)"
            : "var(--green)";
}


/* -------------------------
   CATEGORY OVERVIEW
------------------------- */

function renderCategories() {

    const container =
        document.getElementById(
            "categoryList"
        );

    const totals =
        getTotalsByCategory();

    container.innerHTML = "";


    categories.forEach(category => {

        const budget =
            Number(
                data.budgets[category] || 0
            );

        const spent =
            Number(
                totals[category] || 0
            );

        const percentage =
            budget > 0
                ? (spent / budget) * 100
                : 0;

        let statusText = "No budget";

        let statusClass = "safe";

        if (budget > 0) {

            if (spent > budget) {
                statusText = "Over budget";
                statusClass = "danger";
            }

            else if (percentage >= 80) {
                statusText = "Near limit";
                statusClass = "warning";
            }

            else {
                statusText = "On track";
                statusClass = "safe";
            }
        }


        const width =
            Math.min(percentage, 100);


        const card =
            document.createElement("div");

        card.className =
            "category-card";


        card.innerHTML = `
            <div class="category-top">

                <span class="category-name">
                    ${category}
                </span>

                <span class="status ${statusClass}">
                    ${statusText}
                </span>

            </div>

            <div class="progress">

                <div
                    class="progress-bar ${
                        statusClass === "danger"
                            ? "danger"
                            : ""
                    }"
                    style="width:${width}%"
                ></div>

            </div>

            <div class="amount-row">

                <span>
                    Spent: ${currency(spent)}
                </span>

                <span>
                    Budget: ${currency(budget)}
                </span>

            </div>
        `;


        container.appendChild(card);
    });
}


/* -------------------------
   CHART
------------------------- */

function renderChart() {

    const canvas =
        document.getElementById(
            "budgetChart"
        );

    const totals =
        getTotalsByCategory();


    const budgets =
        categories.map(
            category =>
                Number(
                    data.budgets[category] || 0
                )
        );


    const actuals =
        categories.map(
            category =>
                Number(
                    totals[category] || 0
                )
        );


    if (budgetChart) {
        budgetChart.destroy();
    }


    budgetChart =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: categories,

                datasets: [

                    {
                        label: "Budget",

                        data: budgets,

                        backgroundColor:
                            "rgba(49, 75, 155, 0.75)",

                        borderRadius: 7
                    },

                    {
                        label: "Actual Spending",

                        data: actuals,

                        backgroundColor:
                            "rgba(244, 123, 32, 0.80)",

                        borderRadius: 7
                    }

                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {
                    mode: "index",
                    intersect: false
                },

                plugins: {

                    legend: {
                        position: "bottom"
                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                return (
                                    context.dataset.label +
                                    ": " +
                                    currency(
                                        context.raw
                                    )
                                );
                            }
                        }
                    }
                },

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            callback: function(value) {
                                return "₹" + value;
                            }
                        }
                    }
                }
            }
        });
}


/* -------------------------
   EXPENSE LIST
------------------------- */

function renderExpenses() {

    const container =
        document.getElementById(
            "expenseList"
        );

    container.innerHTML = "";


    if (data.expenses.length === 0) {

        container.innerHTML = `
            <div class="empty">
                No expenses recorded yet.
                Add your first expense above.
            </div>
        `;

        return;
    }


    const expenses =
        [...data.expenses]
            .reverse()
            .slice(0, 10);


    expenses.forEach(expense => {

        const item =
            document.createElement("div");

        item.className =
            "expense-item";


        item.innerHTML = `

            <div class="expense-info">

                <div class="expense-avatar">
                    ${expense.category.charAt(0)}
                </div>

                <div>

                    <div class="expense-name">
                        ${expense.note || "Expense"}
                    </div>

                    <div class="expense-meta">
                        ${expense.category}
                        •
                        ${expense.date}
                    </div>

                </div>

            </div>


            <div class="expense-amount">
                - ${currency(expense.amount)}
            </div>
        `;


        container.appendChild(item);
    });
}


/* -------------------------
   TOAST
------------------------- */

function showToast(message) {

    const oldToast =
        document.querySelector(".toast");

    if (oldToast) {
        oldToast.remove();
    }


    const toast =
        document.createElement("div");

    toast.className = "toast";

    toast.textContent = message;

    document.body.appendChild(toast);


    setTimeout(() => {
        toast.remove();
    }, 2500);
}


/* -------------------------
   BUDGET FORM
------------------------- */

document
    .getElementById("budgetForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const category =
                document.getElementById(
                    "budgetCategory"
                ).value;


            const amount =
                Number(
                    document.getElementById(
                        "budgetAmount"
                    ).value
                );


            if (!category || amount <= 0) {

                showToast(
                    "Enter a valid budget amount."
                );

                return;
            }


            data.budgets[category] =
                amount;


            saveData();

            this.reset();

            refreshUI();

            showToast(
                `${category} budget saved successfully.`
            );
        }
    );


/* -------------------------
   EXPENSE FORM
------------------------- */

document
    .getElementById("expenseForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const category =
                document.getElementById(
                    "expenseCategory"
                ).value;


            const amount =
                Number(
                    document.getElementById(
                        "expenseAmount"
                    ).value
                );


            const note =
                document.getElementById(
                    "expenseNote"
                ).value.trim();


            if (!category || amount <= 0) {

                showToast(
                    "Enter a valid expense amount."
                );

                return;
            }


            const expense = {

                id: Date.now(),

                category: category,

                amount: amount,

                note:
                    note ||
                    "Expense",

                date:
                    new Date()
                        .toLocaleDateString(
                            "en-IN"
                        )
            };


            data.expenses.push(
                expense
            );


            saveData();

            this.reset();

            refreshUI();


            const budget =
                Number(
                    data.budgets[category] || 0
                );


            const totals =
                getTotalsByCategory();


            if (
                budget > 0 &&
                totals[category] > budget
            ) {

                showToast(
                    `⚠ ${category} is over budget!`
                );

            } else {

                showToast(
                    "Expense added successfully."
                );
            }
        }
    );


/* -------------------------
   RESET MONTH
------------------------- */

document
    .getElementById("resetBtn")
    .addEventListener(
        "click",
        function() {

            const confirmReset =
                confirm(
                    "Reset all budgets and expenses for this month?"
                );


            if (!confirmReset) {
                return;
            }


            data = {
                budgets: {},
                expenses: []
            };


            saveData();

            refreshUI();

            showToast(
                "Monthly budget has been reset."
            );
        }
    );


/* -------------------------
   REFRESH EVERYTHING
------------------------- */

function refreshUI() {

    updateSummary();

    renderCategories();

    renderChart();

    renderExpenses();
}


/* -------------------------
   START APPLICATION
------------------------- */

showCurrentMonth();

refreshUI();