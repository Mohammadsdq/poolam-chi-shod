
const chartFont = {
    family: "Vazirmatn"
};

// Keep chart instances
let incomeExpenseChart = null;
let expenseCategoryChart = null;

// CHART COLORS
const categoryColors = [
    "#8b5cf6",
    "#38bdf8",
    "#22c55e",
    "#f59e0b",
    "#f87171",
    "#ec4899",
    "#14b8a6"
];

// COMMON CHART OPTIONS
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
        }
    }
};

// RENDER INCOME & EXPENSE CHART
const renderIncomeExpenseChart = (monthlyData = []) => {
    const canvas = document.getElementById("incomeExpenseChart");

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
                    label: "هزینه‌ها",
                    data: monthlyData.map(item => item.expenses / 10),
                    backgroundColor: "#38bdf8",
                    borderRadius: 6,
                    barPercentage: 0.65
                },
                {
                    label: "واریزی‌ها",
                    data: monthlyData.map(item => item.transfersIn / 10),
                    backgroundColor: "#8b5cf6",
                    borderRadius: 6,
                    barPercentage: 0.65
                },
                {
                    label: "برگشت وجه و اصلاحات",
                    data: monthlyData.map(item => item.income / 10),
                    backgroundColor: "#22c55e",
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

                        callback: (value) =>
                            Number(value).toLocaleString("fa-IR")
                    }
                }
            }
        }
    });
};

// RENDER EXPENSE CATEGORY CHART
const renderExpenseCategoryChart = (categories = []) => {
    const canvas = document.getElementById("expenseCategoryChart");

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

            cutout: "72%"
        }
    });
};

// MAIN CHART RENDERER
export const renderCharts = (analysis = null) => {
    const monthlyData = analysis?.monthly || [];
    const categories = analysis?.categories || [];

    renderIncomeExpenseChart(monthlyData);

    renderExpenseCategoryChart(categories);
};