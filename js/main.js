
import { renderCharts } from "./modules/charts.js";
import { initializeFileUpload } from "./modules/fileUpload.js";
import { downloadShareImage } from "./modules/shareReport.js";


// =========================
// DOM ELEMENTS
// =========================

// Sections
const uploadSection = document.getElementById("uploadSection");
const dashboardSection = document.getElementById("dashboardSection");

// Dashboard buttons
const shareReportButton = document.getElementById("shareReportButton");

// Statistics
const balanceValue = document.getElementById("balanceValue");
const depositsValue = document.getElementById("depositsValue");
const expensesValue = document.getElementById("expensesValue");
const transactionCountValue = document.getElementById("transactionCountValue");

// Transactions
const transactionsTable = document.getElementById("transactionsTable");


// =========================
// CONSTANTS & STATE
// =========================

const TRANSACTIONS_PER_PAGE = 10;

let currentPage = 1;

let allTransactions = [];

let currentAnalysis = null;


// =========================
// FORMAT HELPERS
// =========================

const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("fa-IR");
};


// Excel amounts are Rial.
// Dashboard displays Toman.
const formatToman = (amount) => {
    return formatNumber(
        Math.round(Number(amount || 0) / 10)
    );
};


const escapeHTML = (value) => {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
};


const formatDate = (date) => {
    if (!date) return "—";

    if (
        date instanceof Date &&
        !Number.isNaN(date.getTime())
    ) {
        return date.toLocaleDateString("fa-IR");
    }

    const parsedDate = new Date(date);

    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString("fa-IR");
    }

    return escapeHTML(date);
};


// =========================
// STATISTICS
// =========================

const updateStatistics = (summary) => {

    const {
        endingBalance = 0,
        totalDeposits = 0,
        totalExpenses = 0,
        transactionCount = 0
    } = summary || {};


    if (balanceValue) {
        balanceValue.innerHTML = `
            ${formatToman(endingBalance)}
            <small>تومان</small>
        `;
    }


    if (depositsValue) {
        depositsValue.innerHTML = `
            ${formatToman(totalDeposits)}
            <small>تومان</small>
        `;
    }


    if (expensesValue) {
        expensesValue.innerHTML = `
            ${formatToman(totalExpenses)}
            <small>تومان</small>
        `;
    }


    if (transactionCountValue) {
        transactionCountValue.innerHTML = `
            ${formatNumber(transactionCount)}
            <small>تراکنش</small>
        `;
    }

};


// =========================
// TRANSACTION SORTING
// =========================

const sortTransactions = (transactions) => {

    return [...transactions].sort((a, b) => {

        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;

        if (dateA !== dateB) {
            return dateB - dateA;
        }

        return (
            Number(b.sourceRow || 0) -
            Number(a.sourceRow || 0)
        );

    });

};


// =========================
// PAGINATION CONTAINER
// =========================

const createPaginationContainer = () => {

    let container = document.getElementById(
        "transactionsPagination"
    );

    if (container) return container;


    const tableWrapper = transactionsTable?.closest(
        ".transactions-table-wrapper"
    );

    if (!tableWrapper) {
        console.error("Transactions table wrapper not found.");
        return null;
    }


    container = document.createElement("div");

    container.id = "transactionsPagination";
    container.className = "transactions-pagination";

    tableWrapper.insertAdjacentElement(
        "afterend",
        container
    );

    return container;

};


// =========================
// PAGINATION NUMBERS
// =========================

const getPaginationPages = (totalPages) => {

    const pages = [];

    const addPage = (page) => {
        if (!pages.includes(page)) {
            pages.push(page);
        }
    };


    // Show all pages when there are few pages
    if (totalPages <= 7) {

        for (let page = 1; page <= totalPages; page++) {
            addPage(page);
        }

        return pages;
    }


    // First page
    addPage(1);


    // Dots before current page
    if (currentPage > 3) {
        pages.push("...");
    }


    // Current page and neighbors
    for (
        let page = Math.max(2, currentPage - 1);
        page <= Math.min(totalPages - 1, currentPage + 1);
        page++
    ) {
        addPage(page);
    }


    // Dots after current page
    if (currentPage < totalPages - 2) {
        pages.push("...");
    }


    // Last page
    addPage(totalPages);

    return pages;

};


// =========================
// RENDER PAGINATION
// =========================

const renderPagination = () => {

    const container = createPaginationContainer();

    if (!container) return;


    const totalTransactions = allTransactions.length;

    const totalPages = Math.ceil(
        totalTransactions / TRANSACTIONS_PER_PAGE
    );


    // Hide pagination when unnecessary
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }


    const start = (
        (currentPage - 1) * TRANSACTIONS_PER_PAGE
    ) + 1;

    const end = Math.min(
        currentPage * TRANSACTIONS_PER_PAGE,
        totalTransactions
    );


    const pages = getPaginationPages(totalPages);


    // Generate page buttons
    const pageButtons = pages.map(page => {

        if (page === "...") {
            return `
                <span class="pagination-dots">
                    ...
                </span>
            `;
        }


        return `
            <button
                type="button"
                class="pagination-button ${page === currentPage ? "active" : ""}"
                data-page="${page}"
                aria-label="صفحه ${page}"
                aria-current="${page === currentPage ? "page" : "false"}"
            >
                ${formatNumber(page)}
            </button>
        `;

    }).join("");


    container.innerHTML = `

        <div class="pagination-info">

            نمایش ${formatNumber(start)}
            تا ${formatNumber(end)}

            از ${formatNumber(totalTransactions)}
            تراکنش

        </div>


        <div class="pagination-controls">

            <button
                type="button"
                class="pagination-button"
                data-action="prev"
                ${currentPage === 1 ? "disabled" : ""}
                aria-label="صفحه قبلی"
            >
                <i data-lucide="chevron-right"></i>
            </button>


            ${pageButtons}


            <button
                type="button"
                class="pagination-button"
                data-action="next"
                ${currentPage === totalPages ? "disabled" : ""}
                aria-label="صفحه بعدی"
            >
                <i data-lucide="chevron-left"></i>
            </button>

        </div>

    `;


    if (window.lucide) {
        window.lucide.createIcons();
    }

};


// =========================
// RENDER TRANSACTIONS
// =========================

const renderTransactions = () => {

    if (!transactionsTable) return;


    const totalPages = Math.ceil(
        allTransactions.length / TRANSACTIONS_PER_PAGE
    );


    // Keep current page in valid range
    currentPage = Math.min(
        Math.max(currentPage, 1),
        Math.max(totalPages, 1)
    );


    const startIndex = (
        currentPage - 1
    ) * TRANSACTIONS_PER_PAGE;


    const currentTransactions = allTransactions.slice(
        startIndex,
        startIndex + TRANSACTIONS_PER_PAGE
    );


    // Empty state
    if (currentTransactions.length === 0) {

        transactionsTable.innerHTML = `

            <tr>
                <td colspan="5" class="empty-table">

                    تراکنشی برای نمایش وجود ندارد.

                </td>
            </tr>

        `;

        renderPagination();

        return;
    }


    // Generate transaction rows
    transactionsTable.innerHTML = currentTransactions.map(transaction => {

        const deposit = Number(transaction.deposit || 0);
        const withdrawal = Number(transaction.withdrawal || 0);

        const isIncome = deposit > 0;

        const amount = isIncome ? deposit : withdrawal;


        const description = escapeHTML(
            transaction.description ||
            transaction.title ||
            "بدون توضیحات"
        );


        const category = escapeHTML(
            transaction.category ||
            transaction.type ||
            "سایر"
        );


        const date = formatDate(transaction.date);


        const amountClass = isIncome
            ? "transaction-income"
            : "transaction-expense";


        const amountPrefix = isIncome ? "+" : "-";


        return `

            <tr>

                <td>
                    ${date}
                </td>


                <td title="${description}">
                    ${description}
                </td>


                <td>

                    <span class="transaction-type" title="${category}">
                        ${category}
                    </span>

                </td>


                <td class="${amountClass}">

                    ${amountPrefix}${formatToman(amount)}
                    تومان

                </td>


                <td>
                    ${isIncome ? "واریز" : "برداشت"}
                </td>

            </tr>

        `;

    }).join("");


    renderPagination();

};


// =========================
// UPDATE DASHBOARD
// =========================

const updateDashboard = (analysis) => {

    if (
        !analysis?.summary ||
        !Array.isArray(analysis.transactions)
    ) {
        console.error("Invalid analysis data:", analysis);
        return;
    }


    // Save latest successful analysis
    currentAnalysis = analysis;


    // Replace old transactions completely
    allTransactions = sortTransactions(
        analysis.transactions
    );


    // Reset pagination
    currentPage = 1;


    // Show dashboard
    if (uploadSection) {
        uploadSection.hidden = true;
    }

    if (dashboardSection) {
        dashboardSection.hidden = false;
    }


    // Update statistics
    updateStatistics(analysis.summary);


    // Update transaction table
    renderTransactions();


    // Update charts
    renderCharts(analysis);


    // Refresh icons
    if (window.lucide) {
        window.lucide.createIcons();
    }


    // Scroll to dashboard
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

};


// =========================
// TRANSACTIONS LOADED EVENT
// =========================

const handleTransactionsLoaded = (event) => {

    const detail = event.detail || {};

    const analysis = detail.analysis || detail;


    if (
        !analysis?.summary ||
        !Array.isArray(analysis.transactions)
    ) {
        console.error(
            "Invalid transactions:loaded event data:",
            detail
        );

        return;
    }


    // Replace dashboard with latest analysis
    updateDashboard(analysis);


    console.log(
        detail.isReplacement
            ? "Dashboard successfully updated with new Excel file."
            : "Dashboard successfully initialized."
    );

};


// =========================
// PAGINATION EVENTS
// =========================

const initializePagination = () => {

    document.addEventListener("click", (event) => {

        const button = event.target.closest(
            "#transactionsPagination button"
        );

        if (!button || button.disabled) return;


        const totalPages = Math.ceil(
            allTransactions.length / TRANSACTIONS_PER_PAGE
        );


        if (button.dataset.action === "prev") {

            currentPage--;

        } else if (button.dataset.action === "next") {

            currentPage++;

        } else if (button.dataset.page) {

            currentPage = Number(button.dataset.page);

        }


        // Keep page within valid range
        currentPage = Math.min(
            Math.max(currentPage, 1),
            Math.max(totalPages, 1)
        );


        renderTransactions();

    });

};


// =========================
// SHARE REPORT
// =========================

const initializeShareReport = () => {

    if (!shareReportButton) {
        console.warn("Share report button not found.");
        return;
    }


    shareReportButton.addEventListener("click", async () => {

        if (!currentAnalysis) {

            alert("ابتدا یک فایل اکسل آپلود کن.");

            return;
        }


        const originalContent = shareReportButton.innerHTML;


        try {

            // Loading state
            shareReportButton.disabled = true;

            shareReportButton.innerHTML = `

                <i data-lucide="loader-circle"></i>

                <span>
                    در حال ساخت تصویر...
                </span>

            `;


            if (window.lucide) {
                window.lucide.createIcons();
            }


            // Generate and share PNG
            await downloadShareImage(currentAnalysis);


        } catch (error) {

            console.error("Share report error:", error);


            if (error.name !== "AbortError") {

                alert(
                    error.message ||
                    "ساخت تصویر گزارش با خطا مواجه شد."
                );

            }

        } finally {

            // Restore button
            shareReportButton.disabled = false;

            shareReportButton.innerHTML = originalContent;


            if (window.lucide) {
                window.lucide.createIcons();
            }

        }

    });

};


// =========================
// INITIALIZE APP
// =========================

const initializeApp = () => {

    // Listen for successful Excel processing
    window.addEventListener(
        "transactions:loaded",
        handleTransactionsLoaded
    );


    // Initialize modules
    initializeFileUpload();

    initializePagination();

    initializeShareReport();


    // Initial visibility
    if (uploadSection) {
        uploadSection.hidden = false;
    }

    if (dashboardSection) {
        dashboardSection.hidden = true;
    }


    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }


    console.log("Poolam Chi Shod app initialized successfully.");

};


// =========================
// DOM READY
// =========================

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);
