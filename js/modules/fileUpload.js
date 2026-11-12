
import { parseBlueBankExcel } from "./ExcelParser.js";
import { analyzeTransactions } from "./DataAnalyzer.js";

export const initializeFileUpload = () => {

    // =========================
    // DOM ELEMENTS
    // =========================

    const fileInput = document.getElementById("excelFileInput");
    const selectButton = document.getElementById("selectFileButton");
    const replaceButton = document.getElementById("replaceExcelButton");

    const dropzone = document.getElementById("uploadDropzone");
    const fileName = document.getElementById("selectedFileName");

    if (!fileInput) {
        console.error("Excel file input not found.");
        return;
    }

    // Move input outside hidden upload section.
    // This allows file selection from the dashboard too.
    if (fileInput.parentElement !== document.body) {
        document.body.appendChild(fileInput);
    }

    // =========================
    // CONSTANTS & STATE
    // =========================

    const ALLOWED_EXTENSIONS = [".xlsx", ".xls"];

    let isProcessing = false;

    const originalReplaceButtonContent = replaceButton?.innerHTML;


    // =========================
    // UI HELPERS
    // =========================

    const updateFileName = (message, color) => {
        if (!fileName) return;

        fileName.textContent = message;
        fileName.style.color = color;
    };


    const updateReplaceButton = (message, isLoading = false) => {
        if (!replaceButton) return;

        if (isLoading) {
            replaceButton.disabled = true;

            replaceButton.innerHTML = `
                <i data-lucide="loader-circle"></i>
                <span>${message}</span>
            `;
        } else {
            replaceButton.disabled = false;

            replaceButton.innerHTML =
                originalReplaceButtonContent || `
                    <i data-lucide="file-up"></i>
                    <span>آپلود فایل اکسل جدید</span>
                `;
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };


    const setProcessingState = (processing) => {
        isProcessing = processing;

        if (selectButton) {
            selectButton.disabled = processing;
        }

        if (replaceButton) {
            replaceButton.disabled = processing;
        }
    };


    // =========================
    // FILE VALIDATION
    // =========================

    const validateFile = (file) => {
        if (!file) {
            throw new Error("فایلی انتخاب نشده است.");
        }

        const fileName = file.name.toLowerCase();

        const hasValidExtension = ALLOWED_EXTENSIONS.some(extension =>
            fileName.endsWith(extension)
        );

        if (!hasValidExtension) {
            throw new Error(
                "فرمت فایل معتبر نیست! لطفاً فایل XLSX یا XLS انتخاب کن."
            );
        }

        if (file.size === 0) {
            throw new Error("فایل انتخاب‌شده خالی است.");
        }

        return true;
    };


    // =========================
    // FILE HANDLER
    // =========================

    const handleFile = async (file, source = "initial") => {

        if (!file || isProcessing) return;

        const isReplacement = source === "replacement";

        try {

            // Start processing
            setProcessingState(true);

            validateFile(file);

            // Update UI
            if (isReplacement) {
                updateReplaceButton("در حال پردازش...", true);
            } else {
                updateFileName(
                    "در حال بررسی و پردازش فایل...",
                    "#1769e0"
                );
            }


            // =========================
            // PARSE EXCEL
            // =========================

            const transactions = await parseBlueBankExcel(file);

            if (
                !Array.isArray(transactions) ||
                transactions.length === 0
            ) {
                throw new Error(
                    "هیچ تراکنش معتبری در فایل پیدا نشد."
                );
            }


            // =========================
            // ANALYZE TRANSACTIONS
            // =========================

            const analysis = analyzeTransactions(transactions);

            if (
                !analysis?.summary ||
                !Array.isArray(analysis.transactions)
            ) {
                throw new Error(
                    "ساختار اطلاعات تحلیل‌شده معتبر نیست."
                );
            }

            if (
                analysis.transactions.length === 0 ||
                analysis.summary.transactionCount === 0
            ) {
                throw new Error(
                    "تراکنش معتبری برای نمایش وجود ندارد."
                );
            }


            // =========================
            // SUCCESS
            // =========================

            console.log("Raw Transactions:", transactions);
            console.log("Analysis Result:", analysis);

            // Show success message
            updateFileName(
                `${analysis.summary.transactionCount.toLocaleString("fa-IR")} تراکنش با موفقیت تحلیل شد.`,
                "#16a36a"
            );


            // =========================
            // DISPATCH EVENT
            // =========================

            window.dispatchEvent(
                new CustomEvent("transactions:loaded", {
                    detail: {
                        transactions: analysis.transactions,
                        analysis,
                        fileName: file.name,
                        isReplacement
                    }
                })
            );

        } catch (error) {

            // =========================
            // ERROR HANDLING
            // =========================

            console.error("Excel Processing Error:", error);

            const errorMessage =
                error.message || "خطا در پردازش فایل اکسل.";

            updateFileName(errorMessage, "#e25563");

            if (isReplacement) {
                console.warn(
                    "New Excel file could not be processed. Previous dashboard data remains unchanged."
                );
            }

        } finally {

            // =========================
            // RESET STATE
            // =========================

            setProcessingState(false);

            if (isReplacement) {
                updateReplaceButton();
            }

        }
    };


    // =========================
    // OPEN FILE PICKER
    // =========================

    const openFilePicker = (source = "initial") => {

        if (isProcessing) return;

        // Remember which button opened the file picker
        fileInput.dataset.source = source;

        // Allow selecting the same file again
        fileInput.value = "";

        fileInput.click();
    };


    // =========================
    // INITIAL UPLOAD BUTTON
    // =========================

    selectButton?.addEventListener("click", () => {
        openFilePicker("initial");
    });


    // =========================
    // REPLACE EXCEL BUTTON
    // =========================

    replaceButton?.addEventListener("click", () => {
        openFilePicker("replacement");
    });


    // =========================
    // FILE INPUT CHANGE
    // =========================

    fileInput.addEventListener("change", (event) => {

        const file = event.target.files?.[0];

        const source = event.target.dataset.source || "initial";

        if (!file) return;

        handleFile(file, source);

    });


    // =========================
    // DRAG & DROP
    // =========================

    if (dropzone) {

        dropzone.addEventListener("dragover", (event) => {

            event.preventDefault();

            if (!isProcessing) {
                dropzone.classList.add("drag-over");
            }

        });


        dropzone.addEventListener("dragleave", (event) => {

            if (!dropzone.contains(event.relatedTarget)) {
                dropzone.classList.remove("drag-over");
            }

        });


        dropzone.addEventListener("drop", (event) => {

            event.preventDefault();

            dropzone.classList.remove("drag-over");

            if (isProcessing) return;

            const file = event.dataTransfer?.files?.[0];

            handleFile(file, "initial");

        });

    }


    // =========================
    // INITIALIZATION
    // =========================

    if (!selectButton) {
        console.warn("Initial file selection button not found.");
    }

    if (!replaceButton) {
        console.warn("Replace Excel button not found.");
    }

    console.log("File upload module initialized successfully.");

};
