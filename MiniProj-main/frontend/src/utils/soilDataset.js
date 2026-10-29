import Papa from "papaparse";
import { readSheet } from "read-excel-file/browser";

export const SOIL_FIELDS = [
    { key: "soilMoisture", label: "Soil moisture" },
    { key: "ambientTemperature", label: "Temperature" },
    { key: "soilTemperature", label: "Soil temperature" },
    { key: "humidity", label: "Humidity" },
    { key: "pH", label: "pH" },
    { key: "electricalConductivity", label: "Electrical conductivity" },
    { key: "nitrogen", label: "Nitrogen" },
    { key: "phosphorus", label: "Phosphorus" },
    { key: "potassium", label: "Potassium" },
    { key: "rainfall", label: "Rainfall" },
    { key: "referenceET", label: "Reference evapotranspiration" },
    { key: "evapotranspiration", label: "Evapotranspiration" },
    { key: "solarRadiation", label: "Solar radiation" },
    { key: "windSpeed", label: "Wind speed" },
    { key: "daysPlanted", label: "Days planted" },
    { key: "cropCoefficient", label: "Crop coefficient" },
    { key: "growthStage", label: "Crop coefficient stage" },
    { key: "crop", label: "Crop" },
    { key: "timestamp", label: "Timestamp" }
];

const FIELD_ALIASES = [
    ["soilTemperature", (header) => /soil.*temp|temp.*soil/.test(header)],
    ["growthStage", (header) => /growthstage|cro pcoefficientstage|cropcoefficientstage|stage/.test(header)],
    ["cropCoefficient", (header) => /cropcoefficient|(^|[^a-z])kc([^a-z]|$)/.test(header)],
    ["referenceET", (header) => /referenceevapotranspiration|eto|referenceet/.test(header)],
    ["evapotranspiration", (header) => /evapotranspiration|etc/.test(header)],
    ["electricalConductivity", (header) => /electricalconductivity|conductivity|(^|[^a-z])ec([^a-z]|$)/.test(header)],
    ["soilMoisture", (header) => /soilmoisture|moisture|volumetricwatercontent/.test(header)],
    ["ambientTemperature", (header) => /ambienttemp|airtemp|temperature|(^|[^a-z])temp/.test(header)],
    ["humidity", (header) => /humidity|relativehumidity/.test(header)],
    ["nitrogen", (header) => /nitrogen|soiln/.test(header) || header === "n"],
    ["phosphorus", (header) => /phosphorus|soilp/.test(header) || header === "p"],
    ["potassium", (header) => /potassium|soilk/.test(header) || header === "k"],
    ["solarRadiation", (header) => /solarradiation|ghi/.test(header)],
    ["windSpeed", (header) => /windspeed|windvelocity/.test(header)],
    ["daysPlanted", (header) => /daysplanted|daysafterplanting|cropage/.test(header)],
    ["rainfall", (header) => /rainfall|precipitation/.test(header)],
    ["timestamp", (header) => /timestamp|datetime|date|time/.test(header)],
    ["crop", (header) => /^crop(type)?$/.test(header)],
    ["pH", (header) => /soilph|phvalue|ph/.test(header)]
];

function normalizeHeader(value) {
    return String(value ?? "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
}

function getField(header) {
    const normalized = normalizeHeader(header);
    for (const [field, matches] of FIELD_ALIASES) {
        if (matches(normalized)) return field;
    }
    return null;
}

function getUnit(header) {
    const unit = String(header).match(/\[([^\]]+)\]|\(([^)]+)\)/)?.slice(1).find(Boolean)?.trim();
    return unit || null;
}

function parseNumeric(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || value.trim() === "") return null;
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
}

function rowHasContent(row) {
    return row.some((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

export function normalizeSoilTable(headers, tableRows, fileName) {
    const columnMap = {};
    const units = {};
    const unsupportedColumns = [];

    headers.forEach((header, index) => {
        const field = getField(header);
        if (!field) {
            if (String(header ?? "").trim()) unsupportedColumns.push(String(header));
            return;
        }
        columnMap[field] = index;
        units[field] = getUnit(header);
    });

    const rows = tableRows
        .map((cells, index) => {
            const values = {};
            for (const [field, columnIndex] of Object.entries(columnMap)) {
                const rawValue = cells[columnIndex];
                if (field === "timestamp") {
                    if (rawValue instanceof Date && !Number.isNaN(rawValue.getTime())) {
                        values.timestamp = rawValue.toISOString();
                    } else if (typeof rawValue === "string" && rawValue.trim()) {
                        const timestamp = new Date(rawValue);
                        values.timestamp = Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
                    } else {
                        values.timestamp = null;
                    }
                } else if (field === "growthStage" || field === "crop") {
                    values[field] = rawValue === null || rawValue === undefined || String(rawValue).trim() === ""
                        ? null
                        : String(rawValue).trim();
                } else {
                    values[field] = parseNumeric(rawValue);
                }
            }
            return { rowNumber: index + 2, ...values };
        })
        .filter((row) => Object.entries(row).some(([key, value]) => key !== "rowNumber" && value !== null && value !== undefined));

    const availableFields = SOIL_FIELDS
        .filter(({ key }) => columnMap[key] !== undefined && rows.some((row) => row[key] !== null && row[key] !== undefined))
        .map(({ key, label }) => ({ key, label, unit: units[key] }));

    if (!rows.length) {
        throw new Error("The selected file has no non-empty data rows.");
    }
    if (!availableFields.length) {
        throw new Error("No recognized soil or environmental columns were found. Include columns such as Soil moisture, pH, Nitrogen, or a timestamp.");
    }

    const timestampedRows = rows.filter((row) => row.timestamp);
    const latestTimestamp = timestampedRows.length
        ? timestampedRows.reduce((latest, row) => row.timestamp > latest ? row.timestamp : latest, timestampedRows[0].timestamp)
        : null;

    return {
        fileName,
        rows,
        availableFields,
        unsupportedColumns,
        latestTimestamp,
        moistureUnit: units.soilMoisture,
        importedAt: new Date().toISOString()
    };
}

function tableFromObjects(records) {
    if (!Array.isArray(records) || records.length === 0 || !records[0] || typeof records[0] !== "object" || Array.isArray(records[0])) {
        throw new Error("JSON must contain a non-empty array of row objects.");
    }
    const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
    return { headers, rows: records.map((record) => headers.map((header) => record[header] ?? null)) };
}

function findRecords(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object") {
        for (const key of ["records", "rows", "data", "env_data"]) {
            if (Array.isArray(payload[key])) return payload[key];
        }
    }
    return null;
}

export async function parseSoilFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "json"].includes(extension)) {
        throw new Error("Choose an .xlsx, .csv, or .json file.");
    }
    if (file.size > 20 * 1024 * 1024) {
        throw new Error("Files must be 20 MB or smaller.");
    }

    let headers;
    let rows;
    if (extension === "csv") {
        const parsed = Papa.parse(await file.text(), {
            skipEmptyLines: "greedy",
            dynamicTyping: false
        });
        if (parsed.errors.length) {
            throw new Error(`Could not read CSV row ${parsed.errors[0].row + 1}: ${parsed.errors[0].message}`);
        }
        [headers, ...rows] = parsed.data;
    } else if (extension === "xlsx") {
        const sheet = await readSheet(file, 1);
        [headers, ...rows] = sheet;
    } else {
        let payload;
        try {
            payload = JSON.parse(await file.text());
        } catch {
            throw new Error("The selected JSON file is not valid JSON.");
        }
        const records = findRecords(payload);
        if (!records) {
            throw new Error("JSON must be an array of rows or contain a records, rows, data, or env_data array.");
        }
        ({ headers, rows } = tableFromObjects(records));
    }

    if (!headers || !headers.some((header) => String(header ?? "").trim())) {
        throw new Error("The first row of the file must contain column headers.");
    }
    return normalizeSoilTable(
        headers.map((header) => String(header ?? "").replace(/^\uFEFF/, "").trim()),
        rows.filter(rowHasContent),
        file.name
    );
}

export function getSoilValueLabel(field, unit) {
    if (unit) return `${field} [${unit}]`;
    return field;
}
