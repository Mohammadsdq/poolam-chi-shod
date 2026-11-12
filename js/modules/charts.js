
import {
    monthlyData,
    expenseCategories
} from "../data/mockData.js";

const chartFont = {
    family: "Vazirmatn"
};

export const renderCharts = () => {

    // INCOME & EXPENSE CHART

    const incomeCanvas = document.getElementById(
        "incomeExpenseChart"
    );

    new Chart(incomeCanvas, {
        type: "bar",

        data: {
            labels: monthlyData.labels,

            datasets: [
                {
                    label: "درآمد",
                    data: monthlyData.income,

                    backgroundColor: "#8b5cf6",
                    borderRadius: 6,
                    barPercentage: 0.65
                },

                {
                    label: "هزینه",
                    data: monthlyData.expenses,

                    backgroundColor: "#38bdf8",
                    borderRadius: 6,
                    barPercentage: 0.65
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",

                    labels: {
                        color: "#9299ad",
                        font: chartFont,
                        usePointStyle: true,
                        padding: 20
                    }
                }
            },

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
                    grid: {
                        color: "rgba(255,255,255,0.05)"
                    },

                    ticks: {
                        color: "#9299ad",
                        font: chartFont
                    }
                }
            }
        }
    });


    // EXPENSE CATEGORY CHART

    const categoryCanvas = document.getElementById(
        "expenseCategoryChart"
    );

    new Chart(categoryCanvas, {
        type: "doughnut",

        data: {
            labels: expenseCategories.labels,

            datasets: [
                {
                    data: expenseCategories.values,

                    backgroundColor: [
                        "#8b5cf6",
                        "#38bdf8",
                        "#22c55e",
                        "#f59e0b",
                        "#f87171"
                    ],

                    borderWidth: 0,
                    hoverOffset: 8
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "72%",

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
        }
    });

};
