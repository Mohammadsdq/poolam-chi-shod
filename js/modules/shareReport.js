
const formatNumber = (value) => {
    return Math.round(Number(value || 0)).toLocaleString("fa-IR");
};

const formatToman = (rial) => {
    return formatNumber(Number(rial || 0) / 10);
};

const normalizeText = (value) => {
    return String(value ?? "").trim() || "سایر";
};

// دریافت بازه زمانی تراکنش‌ها
const getDateRange = (transactions) => {
    const dates = transactions
        .map(transaction => transaction.date)
        .filter(Boolean)
        .map(date => {
            if (date instanceof Date) return date;

            const parsed = new Date(date);

            return Number.isNaN(parsed.getTime()) ? null : parsed;
        })
        .filter(Boolean)
        .sort((a, b) => a - b);

    if (!dates.length) return "بازه زمانی نامشخص";

    const first = dates[0].toLocaleDateString("fa-IR");
    const last = dates.at(-1).toLocaleDateString("fa-IR");

    return first === last ? first : `${first} تا ${last}`;
};

// محاسبه دسته‌بندی هزینه‌ها
const getCategories = (transactions) => {
    const categories = {};

    transactions.forEach(transaction => {
        const withdrawal = Number(transaction.withdrawal || 0);

        if (withdrawal <= 0) return;

        const category = normalizeText(
            transaction.category || transaction.type
        );

        categories[category] =
            (categories[category] || 0) + withdrawal;
    });

    return Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
};

// رسم مستطیل با گوشه‌های گرد
const roundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    ctx.fill();
};

// رسم متن
const drawText = (ctx, text, x, y, options = {}) => {
    if (!ctx || typeof ctx.fillText !== "function") {
        throw new Error("Canvas context معتبر نیست.");
    }

    const {
        size = 26,
        color = "#202b3c",
        weight = 500,
        align = "right"
    } = options;

    ctx.font = `${weight} ${size}px Vazirmatn, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    ctx.direction = "rtl";

    ctx.fillText(String(text), x, y);
};

// ساخت تصویر گزارش مالی
const drawReport = async (analysis) => {
    if (!analysis || !Array.isArray(analysis.transactions)) {
        throw new Error("اطلاعات تراکنش‌ها معتبر نیست.");
    }

    // اطمینان از بارگذاری فونت
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const transactions = analysis.transactions;
    const summary = analysis.summary || {};

    const canvas = document.createElement("canvas");

    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("امکان ساخت Canvas وجود ندارد.");
    }

    const width = canvas.width;

    const categories = getCategories(transactions);

    const totalExpense = Number(summary.totalExpenses || 0);
    const totalIncome = Number(summary.totalDeposits || 0);
    const balance = Number(summary.endingBalance || 0);

    // Background
    ctx.fillStyle = "#f4f7fb";
    ctx.fillRect(0, 0, width, canvas.height);

    // Main card
    ctx.fillStyle = "#ffffff";
    roundedRect(ctx, 30, 30, width - 60, 1290, 24);

    // Top accent
    ctx.fillStyle = "#1769e0";
    roundedRect(ctx, 30, 30, width - 60, 15, 8);

    // Brand
    drawText(ctx, "پولام چی شد؟", 970, 125, {
        size: 34,
        weight: 800,
        color: "#1769e0"
    });

    drawText(ctx, "گزارش مالی شخصی", 970, 170, {
        size: 19,
        color: "#8793a5"
    });

    // Date range
    drawText(ctx, getDateRange(transactions), 970, 250, {
        size: 18,
        color: "#8793a5"
    });

    drawText(
        ctx,
        `${formatNumber(transactions.length)} تراکنش`,
        970,
        290,
        {
            size: 18,
            color: "#8793a5"
        }
    );

    // Main title
    drawText(ctx, "پول من کجا رفت؟", width / 2, 390, {
        size: 62,
        weight: 800,
        align: "center",
        color: "#202b3c"
    });

    drawText(ctx, "خلاصه وضعیت مالی حساب من", width / 2, 440, {
        size: 23,
        color: "#8793a5",
        align: "center"
    });

    // Balance cards
    const cardY = 510;
    const cardWidth = 450;
    const cardHeight = 175;

    ctx.fillStyle = "#e8f1ff";
    roundedRect(ctx, 560, cardY, cardWidth, cardHeight, 18);

    ctx.fillStyle = "#f4f7fb";
    roundedRect(ctx, 70, cardY, cardWidth, cardHeight, 18);

    // Total income
    drawText(ctx, "کل واریزی", 960, 565, {
        size: 22,
        color: "#65758b"
    });

    drawText(ctx, `${formatToman(totalIncome)} تومان`, 960, 625, {
        size: 34,
        weight: 800,
        color: "#16a36a"
    });

    // Total expenses
    drawText(ctx, "کل برداشتی", 470, 565, {
        size: 22,
        color: "#65758b"
    });

    drawText(ctx, `${formatToman(totalExpense)} تومان`, 470, 625, {
        size: 34,
        weight: 800,
        color: "#e25563"
    });

    // Balance
    drawText(ctx, "موجودی نهایی حساب", width / 2, 770, {
        size: 25,
        color: "#65758b",
        align: "center"
    });

    drawText(ctx, `${formatToman(balance)} تومان`, width / 2, 825, {
        size: 42,
        weight: 800,
        align: "center",
        color: "#1769e0"
    });

    // Category section
    drawText(ctx, "سهم دسته‌ها از برداشت‌ها", 970, 930, {
        size: 27,
        weight: 800,
        color: "#202b3c"
    });

    const totalCategories = categories.reduce(
        (sum, item) => sum + item[1],
        0
    );

    const maxValue = categories[0]?.[1] || 1;

    // Category rows
    categories.forEach(([name, amount], index) => {
        const y = 1000 + index * 57;

        const percentage = totalCategories
            ? Math.round((amount / totalCategories) * 100)
            : 0;

        const barWidth = 860 * (amount / maxValue);

        drawText(ctx, name, 970, y, {
            size: 20,
            color: "#202b3c"
        });

        drawText(ctx, `${formatNumber(percentage)}٪`, 80, y, {
            size: 19,
            color: "#1769e0",
            align: "left"
        });

        // Background bar
        ctx.fillStyle = "#e9eef5";
        roundedRect(ctx, 110, y + 13, 860, 10, 5);

        // Progress bar
        ctx.fillStyle = "#1769e0";
        roundedRect(ctx, 110, y + 13, barWidth, 10, 5);
    });

    // Empty categories
    if (categories.length === 0) {
        drawText(ctx, "هزینه‌ای برای دسته‌بندی وجود ندارد.", 970, 1010, {
            size: 20,
            color: "#8793a5"
        });
    }

    // Footer
    drawText(
        ctx,
        "این گزارش بر اساس فایل اکسل واردشده تهیه شده است.",
        width / 2,
        1280,
        {
            size: 16,
            color: "#8793a5",
            align: "center"
        }
    );

    return canvas;
};

// دانلود تصویر گزارش
export const downloadShareImage = async (analysis) => {
    if (!analysis || !Array.isArray(analysis.transactions)) {
        throw new Error("اطلاعاتی برای ساخت گزارش وجود ندارد.");
    }

    const canvas = await drawReport(analysis);

    const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
        throw new Error("ساخت تصویر با خطا مواجه شد.");
    }

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "poolam-chi-shod-report.png";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // آزادسازی حافظه
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
};
