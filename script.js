
const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");

const totalBalance = document.getElementById("totalBalance");
const totalIncome = document.getElementById("totalIncome");
const totalExpenses = document.getElementById("totalExpenses");

const transactionList = document.getElementById("transactionList");
const emptyState = document.getElementById("emptyState");
const transactionCount = document.getElementById("transactionCount");
const formMessage = document.getElementById("formMessage");

// Set today's date automatically.
dateInput.value = new Date().toLocaleDateString("en-CA");

// Load previously saved transactions.
let transactions = [];

try {
    const savedTransactions = localStorage.getItem("spendwiseTransactions");
    const parsedTransactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];

    if (Array.isArray(parsedTransactions)) {
        transactions = parsedTransactions.filter((item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.description === "string" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            (item.type === "income" || item.type === "expense") &&
            typeof item.date === "string"
        );
    }
} catch (error) {
    console.error("Could not load saved transactions:", error);
}

// Format amounts in Indian Rupees.
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Save transactions in the browser.
function saveTransactions() {
    try {
        localStorage.setItem(
            "spendwiseTransactions",
            JSON.stringify(transactions)
        );
        return true;
    } catch (error) {
        console.error("Could not save transactions:", error);
        formMessage.textContent =
            "Unable to save data. Check browser storage settings.";
        return false;
    }
}

// Calculate income, expenses, and balance.
function updateSummary() {
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
        if (transaction.type === "income") {
            income += transaction.amount;
        } else {
            expenses += transaction.amount;
        }
    }

    const balance = income - expenses;

    totalIncome.textContent = formatCurrency(income);
    totalExpenses.textContent = formatCurrency(expenses);
    totalBalance.textContent = formatCurrency(balance);
}

// Format dates for display.
function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

// Display transaction history.
function renderTransactions() {
    transactionList.replaceChildren();

    emptyState.hidden = transactions.length > 0;

    transactionCount.textContent =
        `${transactions.length} ${
            transactions.length === 1 ? "record" : "records"
        }`;

    const sortedTransactions = [...transactions].sort((a, b) =>
        b.date.localeCompare(a.date) ||
        b.id.localeCompare(a.id)
    );

    for (const transaction of sortedTransactions) {
        const item = document.createElement("div");
        item.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const icon = document.createElement("div");
        icon.className = `transaction-icon ${
            transaction.type === "income" ? "income-icon" : "expense-icon"
        }`;
        icon.textContent =
            transaction.type === "income" ? "↙" : "↗";

        const details = document.createElement("div");
        details.className = "transaction-details";

        const description = document.createElement("h4");
        description.textContent = transaction.description;

        const date = document.createElement("p");
        date.textContent = formatDate(transaction.date);

        details.append(description, date);
        info.append(icon, details);

        const right = document.createElement("div");
        right.className = "transaction-right";

        const amount = document.createElement("div");
        amount.className = `transaction-amount ${transaction.type}`;

        const sign = transaction.type === "income" ? "+" : "-";
        amount.textContent = `${sign}${formatCurrency(transaction.amount)}`;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${transaction.description}`
        );

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });

        right.append(amount, deleteButton);
        item.append(info, right);
        transactionList.appendChild(item);
    }

    updateSummary();
}

// Add a new transaction.
transactionForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const descriptionValue = descriptionInput.value.trim();
    const amountValue = Number(amountInput.value);
    const typeValue = typeInput.value;
    const dateValue = dateInput.value;

    if (!descriptionValue) {
        formMessage.textContent = "Please enter a description.";
        return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
        formMessage.textContent = "Please enter an amount greater than zero.";
        return;
    }

    if (typeValue !== "income" && typeValue !== "expense") {
        formMessage.textContent = "Please select a valid transaction type.";
        return;
    }

    if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        formMessage.textContent = "Please select a valid date.";
        return;
    }

    const transactionData = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        description: descriptionValue,
        amount: Math.round(amountValue * 100) / 100,
        type: typeValue,
        date: dateValue
    };

    transactions.push(transactionData);

    if (!saveTransactions()) {
        transactions.pop();
        return;
    }

    renderTransactions();

    formMessage.textContent = "Transaction added successfully!";

    transactionForm.reset();
    dateInput.value = new Date().toLocaleDateString("en-CA");
    typeInput.value = "expense";
    descriptionInput.focus();
});

// Delete a transaction.
function deleteTransaction(id) {
    const previousTransactions = transactions;

    transactions = transactions.filter(
        (transaction) => transaction.id !== id
    );

    if (!saveTransactions()) {
        transactions = previousTransactions;
        return;
    }

    renderTransactions();
    formMessage.textContent = "Transaction deleted successfully.";
}

// Show saved data when the application opens.
renderTransactions();