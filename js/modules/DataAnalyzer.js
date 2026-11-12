
// NORMALIZE TRANSACTION TYPE

const normalizeType = (type) => {
    return String(type ?? "")
        .trim()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u200c\s]/g, "");
};

// TRANSACTION TYPES

const transactionTypes = {
    expense: [
        "خرید از فروشگاه",
        "خرید اینترنتی",
        "قبض",
        "پرداخت خودکار",
        "شارژ سیم‌کارت",
        "کارمزد"
    ],

    transferOut: [
        "انتقال به سپرده",
        "انتقال به کارت",
        "انتقال پل"
    ],

    transferIn: [
        "دریافت از سپرده",
        "دریافت از کارت",
        "دریافت پل",
        "دریافت پایا",
        "شارژ سپرده با کارت"
    ],

    refund: [
        "برگشت پول"
    ],

    adjustment: [
        "اصلاح سند"
    ]
};

// NORMALIZED TRANSACTION TYPES

const normalizedTransactionTypes = Object.fromEntries(
    Object.entries(transactionTypes).map(([key, types]) => [
        key,
        new Set(types.map(normalizeType))
    ])
);

// CATEGORY MAPPER

const getTransactionCategory = (type) => {
    const normalizedType = normalizeType(type);

    if (normalizedTransactionTypes.expense.has(normalizedType)) {
        if (normalizedType.includes("خرید")) return "خرید";
        if (normalizedType === normalizeType("قبض")) return "قبوض";
        if (normalizedType === normalizeType("شارژ سیم‌کارت")) return "شارژ";
        if (normalizedType === normalizeType("کارمزد")) return "کارمزد";

        return "پرداخت خودکار";
    }

    if (normalizedTransactionTypes.transferOut.has(normalizedType)) {
        return "انتقال وجه";
    }

    if (normalizedTransactionTypes.transferIn.has(normalizedType)) {
        return "دریافت وجه";
    }

    if (normalizedTransactionTypes.refund.has(normalizedType)) {
        return "برگشت پول";
    }

    if (normalizedTransactionTypes.adjustment.has(normalizedType)) {
        return "اصلاح حساب";
    }

    return "سایر";
};

// TRANSACTION CLASSIFIER

const classifyTransaction = (transaction) => {
    const type = normalizeType(transaction.type);

    let category = "سایر";
    let flow = "unknown";

    if (normalizedTransactionTypes.expense.has(type)) {
        category = getTransactionCategory(type);
        flow = "expense";
    }

    else if (normalizedTransactionTypes.transferOut.has(type)) {
        category = "انتقال وجه";
        flow = "transferOut";
    }

    else if (normalizedTransactionTypes.transferIn.has(type)) {
        category = "دریافت وجه";
        flow = "transferIn";
    }

    else if (normalizedTransactionTypes.refund.has(type)) {
        category = "برگشت پول";
        flow = "refund";
    }

    else if (normalizedTransactionTypes.adjustment.has(type)) {
        category = "اصلاح حساب";
        flow = "adjustment";
    }

    return {
        ...transaction,
        category,
        flow
    };
};

// MONTHLY DATE HELPER

const getMonthKey = (date) => {
    const match = String(date ?? "").match(/^(\d{4})\/(\d{1,2})/);

    if (!match) return "نامشخص";

    return `${match[1]}/${match[2].padStart(2, "0")}`;
};

// MAIN ANALYZER

export const analyzeTransactions = (transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error("اطلاعاتی برای تحلیل وجود ندارد.");
    }

    const analyzedTransactions = transactions.map(classifyTransaction);

    // BASIC TOTALS

    const totalDeposits = analyzedTransactions.reduce(
        (total, transaction) => total + (Number(transaction.deposit) || 0),
        0
    );

    const totalWithdrawals = analyzedTransactions.reduce(
        (total, transaction) => total + (Number(transaction.withdrawal) || 0),
        0
    );

    // EXPENSES - EXCLUDING INTERNAL TRANSFERS

    const expenses = analyzedTransactions.filter(
        transaction => transaction.flow === "expense"
    );

    const totalExpenses = expenses.reduce(
        (total, transaction) => total + (Number(transaction.withdrawal) || 0),
        0
    );

    // TRANSFER TOTALS

    const transfersOut = analyzedTransactions.filter(
        transaction => transaction.flow === "transferOut"
    );

    const transfersIn = analyzedTransactions.filter(
        transaction => transaction.flow === "transferIn"
    );

    const totalTransfersOut = transfersOut.reduce(
        (total, transaction) => total + (Number(transaction.withdrawal) || 0),
        0
    );

    const totalTransfersIn = transfersIn.reduce(
        (total, transaction) => total + (Number(transaction.deposit) || 0),
        0
    );

    // REFUNDS

    const refunds = analyzedTransactions.filter(
        transaction => transaction.flow === "refund"
    );

    const totalRefunds = refunds.reduce(
        (total, transaction) => total + (Number(transaction.deposit) || 0),
        0
    );

    // FEES

    const fees = expenses.filter(
        transaction =>
            normalizeType(transaction.type) === normalizeType("کارمزد")
    );

    const totalFees = fees.reduce(
        (total, transaction) => total + (Number(transaction.withdrawal) || 0),
        0
    );

    // CATEGORY STATISTICS

    const categoryStats = {};

    expenses.forEach(transaction => {
        const category = transaction.category;

        if (!categoryStats[category]) {
            categoryStats[category] = {
                category,
                total: 0,
                count: 0
            };
        }

        categoryStats[category].total += Number(transaction.withdrawal) || 0;
        categoryStats[category].count++;
    });

    const categories = Object.values(categoryStats).sort(
        (a, b) => b.total - a.total
    );

    // MONTHLY STATISTICS

    const monthlyStats = {};

    analyzedTransactions.forEach(transaction => {
        const month = getMonthKey(transaction.date);

        if (!monthlyStats[month]) {
            monthlyStats[month] = {
                month,
                income: 0,
                expenses: 0,
                transfersIn: 0,
                transfersOut: 0
            };
        }

        const currentMonth = monthlyStats[month];

        if (transaction.flow === "expense") {
            currentMonth.expenses += Number(transaction.withdrawal) || 0;
        }

        else if (transaction.flow === "transferIn") {
            currentMonth.transfersIn += Number(transaction.deposit) || 0;
        }

        else if (transaction.flow === "transferOut") {
            currentMonth.transfersOut += Number(transaction.withdrawal) || 0;
        }

        else if (
            transaction.flow === "refund" ||
            transaction.flow === "adjustment"
        ) {
            currentMonth.income += Number(transaction.deposit) || 0;
        }
    });

    const monthly = Object.values(monthlyStats).sort(
        (a, b) => a.month.localeCompare(b.month)
    );

    // AVERAGE EXPENSE

    const averageExpense = expenses.length
        ? totalExpenses / expenses.length
        : 0;

    // FINAL BALANCE

    const sortedByDate = [...analyzedTransactions].sort(
        (a, b) => String(b.date).localeCompare(String(a.date))
    );

    const endingBalance = sortedByDate[0]?.balance ?? 0;

    // FINAL RESULT

    return {
        transactions: analyzedTransactions,

        summary: {
            transactionCount: analyzedTransactions.length,
            totalDeposits,
            totalWithdrawals,
            totalExpenses,
            totalTransfersIn,
            totalTransfersOut,
            totalRefunds,
            totalFees,
            averageExpense,
            endingBalance
        },

        categories,
        monthly
    };
};