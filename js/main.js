
import { transactions } from "./data/mockData.js";

import { initializeSidebar } from "./modules/sidebar.js";

import { renderCharts } from "./modules/charts.js";

import { initializeFileUpload } from "./modules/fileUpload.js";


const renderTransactions = () => {

    const table = document.getElementById("transactionsTable");

    const fragment = document.createDocumentFragment();

    transactions.forEach((transaction) => {

        const row = document.createElement("tr");

        const isIncome = transaction.type === "income";

        const amountText = `${isIncome ? "+" : "-"}${transaction.amount.toLocaleString("fa-IR")} تومان`;

        const icon = isIncome ? "arrow-down-left" : "shopping-bag";

        row.innerHTML = `
            <td>
                <div class="transaction-name">

                    <div class="transaction-icon">
                        <i data-lucide="${icon}"></i>
                    </div>

                    <div>
                        <strong>${transaction.title}</strong>
                        <span>${transaction.description}</span>
                    </div>

                </div>
            </td>

            <td>
                <span class="category-badge">
                    ${transaction.category}
                </span>
            </td>

            <td>${transaction.date}</td>

            <td class="${isIncome ? "amount-income" : "amount-expense"}">
                ${amountText}
            </td>

            <td>
                <span class="status-badge">
                    موفق
                </span>
            </td>
        `;

        fragment.appendChild(row);

    });

    table.replaceChildren(fragment);

};


const initializeApp = () => {

    initializeSidebar();

    initializeFileUpload();

    renderTransactions();

    renderCharts();

    lucide.createIcons();

};


document.addEventListener("DOMContentLoaded", initializeApp);
