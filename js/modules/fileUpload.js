import { parseBlueBankExcel } from "./ExcelParser.js";
import { analyzeTransactions } from "./DataAnalyzer.js";

export const initializeFileUpload = () => {

    const fileInput = document.getElementById("excelFileInput");
    const selectButton = document.getElementById("selectFileButton");
    const uploadButton = document.querySelector(".upload-button");
    const dropzone = document.getElementById("uploadDropzone");
    const fileName = document.getElementById("selectedFileName");

    if (!fileInput || !selectButton || !dropzone) return;


    const handleFile = async (file) => {
        if (!file) return;

        const allowedExtensions = [".xlsx", ".xls"];

        const isValid = allowedExtensions.some(extension =>
            file.name.toLowerCase().endsWith(extension)
        );

        if (!isValid) {
            fileName.textContent =
                "فرمت فایل معتبر نیست! فایل Excel انتخاب کن.";

            fileName.style.color = "#f87171";
            return;
        }

        fileName.textContent = "در حال بررسی و پردازش فایل...";
        fileName.style.color = "#fbbf24";


        try {
            const transactions = await parseBlueBankExcel(file);

            // Analyze transactions
            const analysis = analyzeTransactions(transactions);

            fileName.textContent =
                `${analysis.summary.transactionCount} تراکنش با موفقیت تحلیل شد.`;

            fileName.style.color = "#22c55e";

            console.log("Raw Transactions:", transactions);
            console.log("Analysis Result:", analysis);

            // Send analysis to the application
            window.dispatchEvent(
                new CustomEvent("transactions:loaded", {
                    detail: {
                        transactions: analysis.transactions,
                        analysis,
                        fileName: file.name
                    }
                })
            );

        } catch (error) {
            console.error("Excel Processing Error:", error);

            fileName.textContent =
                error.message || "خطا در پردازش فایل اکسل";

            fileName.style.color = "#f87171";
        }

    };


    selectButton.addEventListener("click", () => {
        fileInput.click();
    });

    uploadButton?.addEventListener("click", () => {
        document.getElementById("uploadDropzone")
            .scrollIntoView({ behavior: "smooth", block: "center" });

        fileInput.click();
    });

    fileInput.addEventListener("change", (event) => {
        handleFile(event.target.files[0]);
    });

    // Drag & Drop

    dropzone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropzone.classList.add("drag-over");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("drag-over");
    });

    dropzone.addEventListener("drop", (event) => {
        event.preventDefault();

        dropzone.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        handleFile(file);

        // Keep the selected file accessible through the input.
        if (file) {
            const transfer = new DataTransfer();
            transfer.items.add(file);
            fileInput.files = transfer.files;
        }
    });

};