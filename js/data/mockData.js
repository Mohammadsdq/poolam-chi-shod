
export const transactions = [
    {
        id: 1,
        title: "خرید از فروشگاه",
        description: "خرید روزانه",
        category: "خرید",
        date: "۱۴۰۵/۰۸/۲۰",
        amount: 850000,
        type: "expense"
    },
    {
        id: 2,
        title: "واریز حقوق",
        description: "واریز به حساب",
        category: "درآمد",
        date: "۱۴۰۵/۰۸/۱۹",
        amount: 12000000,
        type: "income"
    },
    {
        id: 3,
        title: "پرداخت اینترنت",
        description: "بسته اینترنت",
        category: "قبض",
        date: "۱۴۰۵/۰۸/۱۸",
        amount: 250000,
        type: "expense"
    },
    {
        id: 4,
        title: "سفارش غذا",
        description: "خرید آنلاین غذا",
        category: "غذا",
        date: "۱۴۰۵/۰۸/۱۷",
        amount: 420000,
        type: "expense"
    },
    {
        id: 5,
        title: "انتقال وجه",
        description: "واریز از شخص دیگر",
        category: "انتقال",
        date: "۱۴۰۵/۰۸/۱۵",
        amount: 2000000,
        type: "income"
    },
    {
        id: 6,
        title: "خرید پوشاک",
        description: "خرید لباس",
        category: "خرید",
        date: "۱۴۰۵/۰۸/۱۴",
        amount: 1500000,
        type: "expense"
    }
];

export const monthlyData = {
    labels: [
        "فروردین",
        "اردیبهشت",
        "خرداد",
        "تیر",
        "مرداد",
        "شهریور",
        "مهر",
        "آبان"
    ],

    income: [
        12, 18, 15, 22, 19, 25, 20, 28
    ],

    expenses: [
        8, 11, 13, 15, 12, 18, 16, 14
    ]
};

export const expenseCategories = {
    labels: [
        "خرید",
        "غذا",
        "قبض",
        "حمل و نقل",
        "سایر"
    ],

    values: [
        35, 25, 15, 10, 15
    ]
};
