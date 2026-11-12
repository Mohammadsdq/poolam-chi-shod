
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

// CATEGORY MAPPER

const getTransactionCategory = (type) => {
    if (transactionTypes.expense.includes(type)) {
        if (type.includes("خرید")) return "خرید";
        if (type === "قبض") return "قبوض";
        if (type === "شارژ سیم‌کارت") return "شارژ";
        if (type === "کارمزد") return "کارمزد";

        return "پرداخت خودکار";
    }

    if (transactionTypes.transferOut.includes(type)) {
        return "انتقال وجه";
    }

    if (transactionTypes.transferIn.includes(type)) {
        return "دریافت وجه";
    }

    if (transactionTypes.refund.includes(type)) {
        return "برگشت پول";
    }

    if (transactionTypes.adjustment.includes(type)) {
        return "اصلاح حساب";
    }

    return "سایر";
};

// TRANSACTION CLASSIFIER

const classifyTransaction = (transaction) => {
    const type = transaction.type;

    let category = "سایر";
    let flow = "unknown";

    if (transactionTypes.expense.includes(type)) {
        category = getTransactionCategory(type);
        flow = "expense";
    }

    else if (transactionTypes.transferOut.includes(type)) {
        category = "انتقال وجه";
        flow = "transferOut";
    }

    else if (transactionTypes.transferIn.includes(type)) {
        category = "دریافت وجه";
        flow = "transferIn";
    }

    else if (transactionTypes.refund.includes(type)) {
        category = "برگشت پول";
        flow = "refund";
    }

    else if (transactionTypes.adjustment.includes(type)) {
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
    const match = String(date).match(/^(\d{4})\/(\d{1,2})/);

    if (!match) return "نامشخص";

    return `${match[1]}/${match[2].padStart(2, "0")}`;
};

// MAIN ANALYZER

export const analyzeTransactions = (transactions) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
        throw new Error("اطلاعاتی برای تحلیل وجود ندارد.");
    }

    const analyzedTransactions = transactions.map(
        classifyTransaction
    );

    // Basic totals
    const totalDeposits = analyzedTransactions.reduce(
        (total, transaction) => total + transaction.deposit,
        0
    );

    const totalWithdrawals = analyzedTransactions.reduce(
        (total, transaction) => total + transaction.withdrawal,
        0
    );

    // Expenses excluding internal transfers
    const expenses = analyzedTransactions.filter(
        transaction => transaction.flow === "expense"
    );

    const totalExpenses = expenses.reduce(
        (total, transaction) => total + transaction.withdrawal,
        0
    );

    // Transfer totals
    const transfersOut = analyzedTransactions.filter(
        transaction => transaction.flow === "transferOut"
    );

    const transfersIn = analyzedTransactions.filter(
        transaction => transaction.flow === "transferIn"
    );

    const totalTransfersOut = transfersOut.reduce(
        (total, transaction) => total + transaction.withdrawal,
        0
    );

    const totalTransfersIn = transfersIn.reduce(
        (total, transaction) => total + transaction.deposit,
        0
    );

    // Refunds
    const refunds = analyzedTransactions.filter(
        transaction => transaction.flow === "refund"
    );

    const totalRefunds = refunds.reduce(
        (total, transaction) => total + transaction.deposit,
        0
    );

    // Fees
    const fees = analyzedTransactions.filter(
        transaction => transaction.type === "کارمزد"
    );

    const totalFees = fees.reduce(
        (total, transaction) => total + transaction.withdrawal,
        0
    );

    // Category statistics
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

        categoryStats[category].total += transaction.withdrawal;
        categoryStats[category].count++;
    });

    const categories = Object.values(categoryStats)
        .sort((a, b) => b.total - a.total);

    // Monthly statistics
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
            currentMonth.expenses += transaction.withdrawal;
        }

        else if (transaction.flow === "transferIn") {
            currentMonth.transfersIn += transaction.deposit;
        }

        else if (transaction.flow === "transferOut") {
            currentMonth.transfersOut += transaction.withdrawal;
        }

        else if (
            transaction.flow === "refund" ||
            transaction.flow === "adjustment"
        ) {
            currentMonth.income += transaction.deposit;
        }
    });

    const monthly = Object.values(monthlyStats)
        .sort((a, b) => a.month.localeCompare(b.month));

    // Average expense
    const averageExpense = expenses.length
        ? totalExpenses / expenses.length
        : 0;

    // Final balance
    const sortedByDate = [...analyzedTransactions].sort(
        (a, b) => {
            const dateA = String(a.date);
            const dateB = String(b.date);

            return dateB.localeCompare(dateA);
        }
    );

    const endingBalance = sortedByDate[0]?.balance ?? 0;

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