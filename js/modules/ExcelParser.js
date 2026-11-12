
const normalizeHeader = (value) => {
    return String(value ?? "")
        .trim()
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, "")
        .replace(/\s+/g, "")
        .replace(/[()（）]/g, "");
};

const toNumber = (value) => {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const normalized = String(value ?? "")
        .replace(/[۰-۹]/g, digit =>
            String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
        )
        .replace(/[٠-٩]/g, digit =>
            String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))
        )
        .replace(/[,٬\s]/g, "")
        .trim();

    const result = Number(normalized);

    return Number.isFinite(result) ? result : 0;
};

export const parseBlueBankExcel = async (file) => {
    if (!window.XLSX) {
        throw new Error("کتابخانه SheetJS بارگذاری نشده است.");
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
        type: "array"
    });

    // Find transaction sheet
    const sheetName =
        workbook.SheetNames.find(name =>
            name.trim().toLowerCase() === "transaction"
        ) || workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
        throw new Error("شیت اطلاعات تراکنش‌ها پیدا نشد.");
    }

    // Convert worksheet to array
    const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        raw: true,
        defval: ""
    });

    // Find header row
    const headerIndex = rows.findIndex(row => {
        const headers = row.map(normalizeHeader);

        return (
            headers.includes("ماندهریال") &&
            headers.includes("برداشتریال") &&
            headers.includes("واریزریال") &&
            headers.includes("نوعتراکنش") &&
            headers.includes("تاریخ")
        );
    });

    if (headerIndex === -1) {
        throw new Error("ساختار فایل اکسل بلو شناسایی نشد.");
    }

    const headers = rows[headerIndex].map(normalizeHeader);

    // Find column indexes
    const columns = {
        balance: headers.indexOf("ماندهریال"),
        withdrawal: headers.indexOf("برداشتریال"),
        deposit: headers.indexOf("واریزریال"),
        type: headers.indexOf("نوعتراکنش"),
        description: headers.indexOf("شرحسند"),
        documentNumber: headers.indexOf("شمارهسند"),
        date: headers.indexOf("تاریخ")
    };

    // Validate required columns
    const missingColumns = Object.entries(columns)
        .filter(([key, index]) =>
            index === -1 && key !== "description"
        );

    if (missingColumns.length > 0) {
        throw new Error("بعضی از ستون‌های ضروری فایل وجود ندارند.");
    }

    // Extract transactions
    const transactions = rows
        .slice(headerIndex + 1)
        .map((row, index) => {
            const date = row[columns.date];
            const type = row[columns.type];

            return {
                id: String(row[columns.documentNumber] || index + 1),

                balance: toNumber(row[columns.balance]),

                withdrawal: toNumber(
                    row[columns.withdrawal]
                ),

                deposit: toNumber(
                    row[columns.deposit]
                ),

                type: String(type ?? "").trim(),

                description: String(
                    row[columns.description] ?? ""
                ).trim(),

                documentNumber: String(
                    row[columns.documentNumber] ?? ""
                ).trim(),

                date: String(date ?? "").trim(),

                sourceRow: headerIndex + index + 2
            };
        })
        .filter(transaction =>
            transaction.date &&
            transaction.type
        );

    if (transactions.length === 0) {
        throw new Error("هیچ تراکنش معتبری در فایل پیدا نشد.");
    }

    return transactions;
};
