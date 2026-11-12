
import { initializeSidebar } from "./modules/sidebar.js";
import { renderCharts } from "./modules/charts.js";
import { initializeFileUpload } from "./modules/fileUpload.js";

// DOM ELEMENTS
const balanceValue = document.getElementById("balanceValue");
const depositsValue = document.getElementById("depositsValue");
const expensesValue = document.getElementById("expensesValue");
const transactionCountValue = document.getElementById("transactionCountValue");
const transactionsTable = document.getElementById("transactionsTable");

// FORMAT RIAL TO TOMAN
const formatToman = (amount) => {
    return Math.round((amount || 0) / 10).toLocaleString("fa-IR");
};

// FORMAT TRANSACTION AMOUNT
const formatTransactionAmount = (transaction) => {
    if (transaction.deposit > 0) {
        return {
            text: `+${formatToman(transaction.deposit)} تومان`,
            className: "amount-income"
        };
    }

    if (transaction.withdrawal > 0) {
        return {
            text: `-${formatToman(transaction.withdrawal)} تومان`,
            className: "amount-expense"
        };
    }

    return {
        text: "۰ تومان",
        className: ""
    };
};

// CREATE TABLE CELL
const createCell = (text, className = "") => {
    const cell = document.createElement("td");

    cell.textContent = text;

    if (className) {
        cell.className = className;
    }

    return cell;
};

// CREATE TRANSACTION ROW
const createTransactionRow = (transaction) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const nameContainer = document.createElement("div");
    nameContainer.className = "transaction-name";

    const iconContainer = document.createElement("div");
    iconContainer.className = "transaction-icon";

    const icon = document.createElement("i");

    const isIncome = transaction.deposit > 0;

    icon.setAttribute(
        "data-lucide",
        isIncome ? "arrow-down-left" : "arrow-up-left"
    );

    iconContainer.appendChild(icon);

    const textContainer = document.createElement("div");

    const title = document.createElement("strong");
    title.textContent = transaction.type || "تراکنش";

    const description = document.createElement("span");
    description.textContent = transaction.description || "بدون توضیحات";

    textContainer.append(title, description);
    nameContainer.append(iconContainer, textContainer);
    nameCell.appendChild(nameContainer);

    const categoryCell = document.createElement("td");
    const categoryBadge = document.createElement("span");

    categoryBadge.className = "category-badge";
    categoryBadge.textContent = transaction.category || "سایر";

    categoryCell.appendChild(categoryBadge);

    const dateCell = createCell(transaction.date);

    const amount = formatTransactionAmount(transaction);
    const amountCell = createCell(amount.text, amount.className);

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");

    statusBadge.className = "status-badge";
    statusBadge.textContent = "ثبت‌شده";

    statusCell.appendChild(statusBadge);

    row.append(
        nameCell,
        categoryCell,
        dateCell,
        amountCell,
        statusCell
    );

    return row;
};

// RENDER TRANSACTIONS
const renderTransactions = (transactions) => {
    const fragment = document.createDocumentFragment();

    // Sort by date and show latest transactions
    const latestTransactions = [...transactions]
        .sort((a, b) => {
            const dateComparison = String(b.date).localeCompare(String(a.date));

            if (dateComparison !== 0) {
                return dateComparison;
            }

            return (b.sourceRow || 0) - (a.sourceRow || 0);
        })
        .slice(0, 10);

    latestTransactions.forEach(transaction => {
        fragment.appendChild(createTransactionRow(transaction));
    });

    transactionsTable.replaceChildren(fragment);
};

// UPDATE STATISTICS
const updateStatistics = (summary) => {
    balanceValue.innerHTML =
        `${formatToman(summary.endingBalance)} <small>تومان</small>`;

    depositsValue.innerHTML =
        `${formatToman(summary.totalDeposits)} <small>تومان</small>`;

    expensesValue.innerHTML =
        `${formatToman(summary.totalExpenses)} <small>تومان</small>`;

    transactionCountValue.innerHTML =
        `${summary.transactionCount.toLocaleString("fa-IR")} <small>تراکنش</small>`;
};

// UPDATE DASHBOARD
const updateDashboard = (analysis) => {
    updateStatistics(analysis.summary);

    renderTransactions(analysis.transactions);

    renderCharts(analysis);

    if (window.lucide) {
        lucide.createIcons();
    }
};

// INITIALIZE APP
const initializeApp = () => {
    initializeSidebar();

    initializeFileUpload();

    // Wait for analyzed Excel data
    window.addEventListener("transactions:loaded", (event) => {
        const { analysis } = event.detail;

        if (!analysis) {
            console.error("Analysis data is missing.");
            return;
        }

        updateDashboard(analysis);
    });

    renderCharts(null);

    lucide.createIcons();
};

document.addEventListener("DOMContentLoaded", initializeApp);