
const normalizeType = (type) => {
    return String(type ?? "")
        .trim()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[\u200c\s]/g, "");
};

const transactionTypes = {
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

    refund: ["برگشت پول"],
    adjustment: ["اصلاح سند"]
};

const typeSets = Object.fromEntries(
    Object.entries(transactionTypes).map(([key, types]) => [
        key,
        new Set(types.map(normalizeType))
    ])
);

// تعیین دسته‌بندی هر تراکنش

const getTransactionCategory = (type) => {
    const normalizedType = normalizeType(type);

    // انتقال وجه
    if (typeSets.transferOut.has(normalizedType)) {
        return "انتقال وجه";
    }

    // دریافت وجه
    if (typeSets.transferIn.has(normalizedType)) {
        return "دریافت وجه";
    }

    // برگشت پول
    if (typeSets.refund.has(normalizedType)) {
        return "برگشت پول";
    }

    // اصلاح حساب
    if (typeSets.adjustment.has(normalizedType)) {
        return "اصلاح حساب";
    }

    // کارمزد
    if (normalizedType.includes(normalizeType("کارمزد"))) {
        return "کارمزد";
    }

    // قبوض
    if (normalizedType.includes(normalizeType("قبض"))) {
        return "قبوض";
    }

    // پرداخت خودکار
    if (normalizedType.includes(normalizeType("پرداخت خودکار"))) {
        return "پرداخت خودکار";
    }

    // شارژ
    if (normalizedType.includes(normalizeType("شارژ"))) {
        return "شارژ";
    }

    // خرید
    if (normalizedType.includes(normalizeType("خرید"))) {
        return "خرید";
    }

    return "سایر";
};

// تشخیص نوع تراکنش
const classifyTransaction = (transaction) => {
    const type = normalizeType(transaction.type);

    let flow = "unknown";

    if (transaction.withdrawal > 0) {
        flow = "expense";
    } else if (transaction.deposit > 0) {
        flow = "income";
    }

    return {
        ...transaction,
        category: getTransactionCategory(type),
        flow
    };
};

// استخراج ماه از تاریخ شمسی
const getMonthKey = (date) => {
    const match = String(date ?? "").match(
        /^(\d{4})\/(\d{1,2})/
    );

    if (!match) return "نامشخص";

    return `${match[1]}/${match[2].padStart(2, "0")}`;
};

// محاسبه مجموع یک فیلد
const sumTransactions = (transactions, field) => {
    return transactions.reduce(
        (total, transaction) => total + (transaction[field] || 0),
        0
    );
};

// تحلیل تمام تراکنش‌ها
export const analyzeTransactions = (rawTransactions) => {
    const transactions = rawTransactions.map(classifyTransaction);

    // مجموع تمام واریزی‌ها
    const totalDeposits = sumTransactions(
        transactions,
        "deposit"
    );

    // مجموع تمام برداشت‌ها، شامل انتقال وجه
    const totalExpenses = sumTransactions(
        transactions,
        "withdrawal"
    );

    // تعداد تراکنش‌ها
    const transactionCount = transactions.length;

    // تراکنش‌های خروجی و ورودی انتقال وجه
    const transfersOut = transactions.filter(transaction =>
        typeSets.transferOut.has(normalizeType(transaction.type))
    );

    const transfersIn = transactions.filter(transaction =>
        typeSets.transferIn.has(normalizeType(transaction.type))
    );

    // برگشت وجه
    const refunds = transactions.filter(transaction =>
        typeSets.refund.has(normalizeType(transaction.type))
    );

    // کارمزدها
    const fees = transactions.filter(transaction =>
        normalizeType(transaction.type) === normalizeType("کارمزد")
    );

    // دسته‌بندی هزینه‌ها بر اساس نوع تراکنش
    // انتقال وجه هم در این بخش جزو هزینه‌ها محسوب می‌شود.
    const categoryMap = {};

    transactions
        .filter(transaction => transaction.withdrawal > 0)
        .forEach(transaction => {
            const category = transaction.category;

            if (!categoryMap[category]) {
                categoryMap[category] = 0;
            }

            categoryMap[category] += transaction.withdrawal;
        });

    const categories = Object.entries(categoryMap)
        .map(([category, total]) => ({
            category,
            total
        }))
        .sort((a, b) => b.total - a.total);

    // آمار ماهانه
    const monthlyMap = {};

    transactions.forEach(transaction => {
        const month = getMonthKey(transaction.date);

        if (!monthlyMap[month]) {
            monthlyMap[month] = {
                month,
                income: 0,
                expenses: 0
            };
        }

        monthlyMap[month].income += transaction.deposit;
        monthlyMap[month].expenses += transaction.withdrawal;
    });

    const monthly = Object.values(monthlyMap)
        .sort((a, b) => a.month.localeCompare(b.month));

    // میانگین هزینه هر تراکنش برداشت
    const expenseTransactions = transactions.filter(
        transaction => transaction.withdrawal > 0
    );

    const averageExpense = expenseTransactions.length
        ? totalExpenses / expenseTransactions.length
        : 0;

    // آخرین موجودی حساب
    const latestTransaction = [...transactions].sort(
        (a, b) => b.date.localeCompare(a.date)
    )[0];

    const endingBalance = latestTransaction?.balance || 0;

    return {
        transactions,

        summary: {
            transactionCount,
            totalDeposits,
            totalWithdrawals: totalExpenses,
            totalExpenses,
            totalTransfersIn: sumTransactions(transfersIn, "deposit"),
            totalTransfersOut: sumTransactions(transfersOut, "withdrawal"),
            totalRefunds: sumTransactions(refunds, "deposit"),
            totalFees: sumTransactions(fees, "withdrawal"),
            averageExpense,
            endingBalance
        },

        categories,
        monthly
    };
};