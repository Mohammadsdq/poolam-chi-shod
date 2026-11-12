
const chartFont = {
    family: "Vazirmatn"
};

let incomeExpenseChart = null;
let expenseCategoryChart = null;

const categoryColors = [
    "#8b5cf6",
    "#38bdf8",
    "#22c55e",
    "#f59e0b",
    "#f87171",
    "#ec4899",
    "#14b8a6",
    "#a78bfa"
];

// تبدیل ریال به تومان و نمایش فارسی
const formatToman = (value) => {
    return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
};

// تنظیمات مشترک نمودارها
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
        legend: {
            position: "bottom",

            labels: {
                color: "#9299ad",
                font: chartFont,
                usePointStyle: true,
                padding: 15
            }
        },

        tooltip: {
            callbacks: {
                label(context) {
                    const value = context.parsed.y ?? context.parsed;

                    return `${context.dataset.label}: ${formatToman(value)}`;
                }
            }
        }
    }
};

// نمودار درآمد و هزینه ماهانه
const renderIncomeExpenseChart = (monthlyData = []) => {
    const canvas = document.getElementById("incomeExpenseChart");

    if (!canvas) return;

    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }

    const labels = monthlyData.map(item => item.month);

    incomeExpenseChart = new Chart(canvas, {
        type: "bar",

        data: {
            labels,

            datasets: [
                {
                    label: "مجموع درآمد",
                    data: monthlyData.map(item => item.income / 10),
                    backgroundColor: "#22c55e",
                    borderRadius: 6,
                    barPercentage: 0.65
                },
                {
                    label: "مجموع هزینه‌ها",
                    data: monthlyData.map(item => item.expenses / 10),
                    backgroundColor: "#f87171",
                    borderRadius: 6,
                    barPercentage: 0.65
                }
            ]
        },

        options: {
            ...commonOptions,

            scales: {
                x: {
                    grid: {
                        display: false
                    },

                    ticks: {
                        color: "#9299ad",
                        font: chartFont
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    },

                    ticks: {
                        color: "#9299ad",
                        font: chartFont,

                        callback(value) {
                            return Number(value).toLocaleString("fa-IR");
                        }
                    }
                }
            }
        }
    });
};

// نمودار دسته‌بندی هزینه‌ها
const renderExpenseCategoryChart = (categories = []) => {
    const canvas = document.getElementById("expenseCategoryChart");

    if (!canvas) return;

    if (expenseCategoryChart) {
        expenseCategoryChart.destroy();
    }

    expenseCategoryChart = new Chart(canvas, {
        type: "doughnut",

        data: {
            labels: categories.map(item => item.category),

            datasets: [
                {
                    data: categories.map(item => item.total / 10),

                    backgroundColor: categories.map(
                        (_, index) =>
                            categoryColors[index % categoryColors.length]
                    ),

                    borderWidth: 0,
                    hoverOffset: 8
                }
            ]
        },

        options: {
            ...commonOptions,

            cutout: "72%",

            plugins: {
                ...commonOptions.plugins,

                tooltip: {
                    callbacks: {
                        label(context) {
                            return `${context.label}: ${formatToman(context.parsed)}`;
                        }
                    }
                }
            }
        }
    });
};

// تابع اصلی نمایش نمودارها
export const renderCharts = (analysis = null) => {
    const monthlyData = analysis?.monthly || [];
    const categories = analysis?.categories || [];

    renderIncomeExpenseChart(monthlyData);
    renderExpenseCategoryChart(categories);
};