import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CategoryScale, Chart as ChartJS, LinearScale, LineElement, PointElement, Tooltip } from "chart.js";
import { Line } from "react-chartjs-2";
import { IoMdArrowRoundBack } from "react-icons/io";
import Navbar from "../../components/navbars/Navbar-actions";
import { parseSoilFile } from "../../utils/soilDataset";
import { CROP_SOIL_RULES, FAO56_SOURCE_URL, getIrrigationAssessment } from "../../utils/cropSoilRules";
import "./SoilIntelligence.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

const CROP_OPTIONS = ["Wheat", "Rice", "Potato", "Corn"];
const GROWTH_STAGES = ["Initial", "Development", "Mid-season", "Late-season"];
const TREND_FIELDS = [
    "soilMoisture",
    "ambientTemperature",
    "soilTemperature",
    "humidity",
    "pH",
    "electricalConductivity",
    "nitrogen",
    "phosphorus",
    "potassium",
    "rainfall"
];
const FIELD_LABELS = {
    soilMoisture: "Soil moisture",
    ambientTemperature: "Temperature",
    soilTemperature: "Soil temperature",
    humidity: "Humidity",
    pH: "pH",
    electricalConductivity: "Electrical conductivity",
    nitrogen: "Nitrogen",
    phosphorus: "Phosphorus",
    potassium: "Potassium",
    rainfall: "Rainfall",
    referenceET: "Reference evapotranspiration",
    evapotranspiration: "Evapotranspiration",
    solarRadiation: "Solar radiation",
    windSpeed: "Wind speed",
    daysPlanted: "Days planted",
    cropCoefficient: "Crop coefficient",
    growthStage: "Crop coefficient stage",
    crop: "Crop",
    timestamp: "Timestamp"
};
const MAX_ROWS = 10000;

function formatValue(value, unit) {
    if (typeof value === "number") return `${Number(value.toFixed(2))}${unit ? ` ${unit}` : ""}`;
    return value || "Not recorded";
}

function inferStage(value) {
    if (!value) return "";
    const stage = String(value).toLowerCase();
    if (stage.includes("initial")) return "Initial";
    if (stage.includes("development")) return "Development";
    if (stage.includes("mid")) return "Mid-season";
    if (stage.includes("late")) return "Late-season";
    return "";
}

function formatAge(milliseconds) {
    if (milliseconds < 0) return "timestamp is in the future; verify the dataset clock";
    const minutes = Math.floor(milliseconds / 60000);
    if (minutes < 60) return `recorded ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 48) return `recorded ${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    return `recorded ${days} day${days === 1 ? "" : "s"} ago`;
}

const SoilIntelligence = () => {
    const inputRef = useRef(null);
    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [crop, setCrop] = useState("");
    const [growthStage, setGrowthStage] = useState("");
    const [moistureUnit, setMoistureUnit] = useState("");
    const [fieldCapacity, setFieldCapacity] = useState("");
    const [wiltingPoint, setWiltingPoint] = useState("");
    const [rootDepth, setRootDepth] = useState("");
    const [trendField, setTrendField] = useState("");

    const latestRow = dataset
        ? dataset.latestTimestamp
            ? dataset.rows.find((row) => row.timestamp === dataset.latestTimestamp)
            : dataset.rows[dataset.rows.length - 1]
        : null;
    const availableKeys = useMemo(
        () => dataset?.availableFields.map((field) => field.key) ?? [],
        [dataset]
    );
    const trendOptions = useMemo(
        () => TREND_FIELDS.filter((field) =>
            availableKeys.includes(field) &&
            dataset.rows.some((row) => typeof row[field] === "number")
        ),
        [availableKeys, dataset]
    );

    const irrigationAssessment = useMemo(() => getIrrigationAssessment({
        crop,
        growthStage,
        moistureValue: latestRow?.soilMoisture,
        moistureUnit,
        fieldCapacity: fieldCapacity === "" ? NaN : Number(fieldCapacity),
        wiltingPoint: wiltingPoint === "" ? NaN : Number(wiltingPoint),
        rootDepth: rootDepth === "" ? NaN : Number(rootDepth)
    }), [crop, fieldCapacity, growthStage, latestRow, moistureUnit, rootDepth, wiltingPoint]);

    const handleFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        setLoading(true);
        setError("");
        try {
            const parsed = await parseSoilFile(file);
            if (parsed.rows.length > MAX_ROWS) {
                throw new Error(`This dashboard supports up to ${MAX_ROWS.toLocaleString()} data rows per upload. Filter the dataset and upload again.`);
            }
            setDataset(parsed);
            setTrendField(parsed.availableFields.some((field) => field.key === "soilMoisture") ? "soilMoisture" : "");
            setGrowthStage(inferStage(parsed.rows[parsed.rows.length - 1].growthStage));
            setMoistureUnit("");
            setFieldCapacity("");
            setWiltingPoint("");
            setRootDepth("");
        } catch (fileError) {
            setError(fileError.message || "Could not read this dataset.");
        } finally {
            setLoading(false);
        }
    };

    const latestTimestamp = dataset?.latestTimestamp ? new Date(dataset.latestTimestamp) : null;
    const fileRecordAge = latestTimestamp ? Date.now() - latestTimestamp.getTime() : null;
    const rawTrendRows = dataset?.rows.filter((row) => typeof row[trendField] === "number") ?? [];
    const timestampAvailable = rawTrendRows.length > 1 && rawTrendRows.every((row) => row.timestamp);
    const ageAvailable = rawTrendRows.length > 1 && rawTrendRows.every((row) => Number.isFinite(row.daysPlanted));
    const orderedTrendRows = timestampAvailable
        ? [...rawTrendRows].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        : ageAvailable
            ? [...rawTrendRows].sort((a, b) => a.daysPlanted - b.daysPlanted)
            : rawTrendRows;
    const trendRows = orderedTrendRows.slice(-60);
    const trendLabels = trendRows.map((row) => timestampAvailable
        ? new Date(row.timestamp).toLocaleDateString()
        : ageAvailable
            ? `${row.daysPlanted} days planted`
            : `Row ${row.rowNumber}`);
    const selectedField = dataset?.availableFields.find((field) => field.key === trendField);
    const chartData = {
        labels: trendLabels,
        datasets: [{
            label: selectedField?.label || "Measurement",
            data: trendRows.map((row) => row[trendField]),
            borderColor: "#34763b",
            backgroundColor: "rgba(52, 118, 59, 0.12)",
            pointRadius: 2,
            tension: 0.25
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { title: { display: true, text: timestampAvailable ? "Dataset timestamp" : ageAvailable ? "Crop age in uploaded records" : "File row order (time not recorded)" } },
            y: { title: { display: true, text: selectedField ? `${selectedField.label}${selectedField.unit ? ` (${selectedField.unit})` : ""}` : "Measurement" } }
        }
    };

    return (
        <div className="soil-intelligence">
            <Navbar />
            <main className="soil-intelligence__content">
                <Link to="/dashboard" className="soil-intelligence__back">
                    <IoMdArrowRoundBack aria-hidden="true" /> Back to Dashboard
                </Link>
                <header className="soil-intelligence__intro">
                    <p className="soil-intelligence__eyebrow">SOIL INTELLIGENCE</p>
                    <h1>Soil Analyzer &amp; Irrigation Advisor</h1>
                    <p>Upload your farm readings to review available soil measurements and crop-specific irrigation guidance.</p>
                </header>

                <section className="soil-intelligence__card" aria-labelledby="soil-upload-title">
                    <div className="soil-intelligence__section-heading">
                        <div>
                            <h2 id="soil-upload-title">Upload your dataset</h2>
                            <p>Supported formats: XLSX, CSV, or JSON. Files are analyzed in this browser and are not sent to a server.</p>
                        </div>
                        <input
                            ref={inputRef}
                            className="soil-intelligence__file-input"
                            type="file"
                            accept=".xlsx,.csv,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                            aria-label="Upload XLSX, CSV, or JSON soil dataset"
                            onChange={handleFile}
                        />
                        <button
                            type="button"
                            className="soil-intelligence__upload-button"
                            onClick={() => inputRef.current?.click()}
                            disabled={loading}
                        >
                            {loading ? "Reading dataset…" : "Upload XLSX / CSV / JSON"}
                        </button>
                    </div>
                    {error && <p className="soil-intelligence__error" role="alert">{error}</p>}
                    {!dataset && !loading && (
                        <p className="soil-intelligence__empty">
                            No dataset loaded. For best results, include column headers, measurement units, crop, growth stage, and timestamps where available.
                        </p>
                    )}
                </section>

                {dataset && latestRow && (
                    <>
                        <div className="soil-intelligence__source-banner">
                            <strong>Uploaded historical dataset — not a live sensor connection</strong>
                            <span>{dataset.fileName} · {dataset.rows.length.toLocaleString()} readings · imported {new Date(dataset.importedAt).toLocaleString()}</span>
                            <span>
                                {latestTimestamp
                                    ? `Most recent recorded measurement: ${latestTimestamp.toLocaleString()} (${formatAge(fileRecordAge)}; no sensor reporting interval is configured)`
                                    : "No timestamp column found; data freshness is unknown."}
                            </span>
                        </div>

                        <section className="soil-intelligence__card">
                            <div className="soil-intelligence__section-heading">
                                <div>
                                    <h2>Latest available measurements</h2>
                                    <p>Latest means the last usable row in the uploaded file, not a confirmed real-time reading.</p>
                                </div>
                                <label className="soil-intelligence__crop-select">
                                    <span>Crop for guidance</span>
                                    <select value={crop} onChange={(event) => setCrop(event.target.value)}>
                                        <option value="">Select a crop</option>
                                        {CROP_OPTIONS.map((option) => <option key={option} value={option}>{option === "Corn" ? "Corn (maize)" : option}</option>)}
                                    </select>
                                </label>
                            </div>
                            {latestRow.crop && <p className="soil-intelligence__notice">Dataset crop label: {latestRow.crop}. Select the crop for this field above to enable crop-specific advice.</p>}
                            <div className="soil-intelligence__measurements">
                                {dataset.availableFields
                                    .filter((field) => field.key !== "timestamp" && field.key !== "crop")
                                    .map((field) => (
                                        <article className="soil-intelligence__measurement" key={field.key}>
                                            <span>{field.label}</span>
                                            <strong>{formatValue(latestRow[field.key], field.unit)}</strong>
                                            <small>{field.unit ? `Unit from header: ${field.unit}` : "Unit not specified in dataset"}</small>
                                        </article>
                                    ))}
                            </div>
                            {dataset.availableFields.every((field) => !["soilMoisture", "pH", "electricalConductivity", "nitrogen", "phosphorus", "potassium", "soilTemperature", "ambientTemperature", "humidity"].includes(field.key)) && (
                                <p className="soil-intelligence__empty">No soil measurements were recognized in this file. Available columns are shown in the import details below.</p>
                            )}
                            <p className="soil-intelligence__notice">
                                Condition alerts for pH, EC, and N/P/K are not classified: local crop thresholds, soil-test method, and calibration are not included. Moisture irrigation guidance is shown only when its required units and soil inputs are supplied below.
                            </p>
                        </section>

                        <section className="soil-intelligence__card">
                            <div className="soil-intelligence__section-heading">
                                <div>
                                    <h2>Historical trends</h2>
                                    <p>{timestampAvailable ? "Measurements are plotted against their uploaded timestamps." : ageAvailable ? "Measurements are plotted against the supplied days-planted field; this is not a forecast." : "Measurements are plotted in file row order because timestamps were not supplied."}</p>
                                </div>
                                {trendOptions.length > 0 && (
                                    <label className="soil-intelligence__crop-select">
                                        <span>Measurement</span>
                                        <select value={trendField} onChange={(event) => setTrendField(event.target.value)}>
                                            {trendOptions.map((field) => <option key={field} value={field}>{FIELD_LABELS[field]}</option>)}
                                        </select>
                                    </label>
                                )}
                            </div>
                            {trendRows.length > 1 ? (
                                <div className="soil-intelligence__chart"><Line data={chartData} options={chartOptions} /></div>
                            ) : (
                                <p className="soil-intelligence__empty">At least two numeric readings of the same measurement are needed to show a trend.</p>
                            )}
                        </section>

                        <section className="soil-intelligence__card">
                            <div className="soil-intelligence__section-heading">
                                <div>
                                    <h2>Crop-specific irrigation advisor</h2>
                                    <p>Transparent FAO-56 depletion baseline. This is a rule-based estimate, not a trained model or automated irrigation command.</p>
                                </div>
                            </div>

                            {!crop ? (
                                <p className="soil-intelligence__notice">Select Wheat, Rice, Potato, or Corn (maize) above. Crop-specific guidance is not shown until a crop is selected.</p>
                            ) : crop === "Rice" ? (
                                <div className="soil-intelligence__notice">
                                    <strong>Rice-specific limitation</strong>
                                    <p>{CROP_SOIL_RULES.Rice.note}</p>
                                    <p>Provide a rice water-management mode and ponded-water depth or field-tube water level in a future sensor/data integration before using automated irrigation advice.</p>
                                </div>
                            ) : (
                                <>
                                    <p className="soil-intelligence__crop-rule">
                                        {crop}: reference no-stress depletion fraction {Math.round(CROP_SOIL_RULES[crop].depletionFraction * 100)}% ({CROP_SOIL_RULES[crop].sourceCrop}, {CROP_SOIL_RULES[crop].source}).
                                    </p>
                                    <p className="soil-intelligence__notice">{CROP_SOIL_RULES[crop].note} The effective root depth and soil water limits below must come from field measurements or local agronomic advice. Historical rainfall, if present, is not a forecast and is not used to calculate irrigation timing.</p>

                                    <div className="soil-intelligence__advisor-form">
                                        <label>
                                            Growth stage
                                            <select value={growthStage} onChange={(event) => setGrowthStage(event.target.value)}>
                                                <option value="">Select current stage</option>
                                                {GROWTH_STAGES.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
                                            </select>
                                        </label>
                                        <label>
                                            Moisture reading unit
                                            <select value={moistureUnit} onChange={(event) => setMoistureUnit(event.target.value)}>
                                                <option value="">Not verified / raw sensor value</option>
                                                <option value="percent">Volumetric water content (%)</option>
                                                <option value="fraction">Volumetric water content (m³/m³)</option>
                                            </select>
                                        </label>
                                        <label>
                                            Field capacity (volumetric %)
                                            <input type="number" min="0" max="100" step="any" value={fieldCapacity} onChange={(event) => setFieldCapacity(event.target.value)} placeholder="From soil test" />
                                        </label>
                                        <label>
                                            Wilting point (volumetric %)
                                            <input type="number" min="0" max="100" step="any" value={wiltingPoint} onChange={(event) => setWiltingPoint(event.target.value)} placeholder="From soil test" />
                                        </label>
                                        <label>
                                            Effective root depth (m)
                                            <input type="number" min="0.01" max="3" step="any" value={rootDepth} onChange={(event) => setRootDepth(event.target.value)} placeholder="For selected crop stage" />
                                        </label>
                                    </div>

                                    {irrigationAssessment.status === "unavailable" ? (
                                        <p className="soil-intelligence__empty" role="status">{irrigationAssessment.reason}</p>
                                    ) : (
                                        <div className={`soil-intelligence__decision soil-intelligence__decision--${irrigationAssessment.status}`} role="status">
                                            <strong>At this uploaded reading: {irrigationAssessment.status === "irrigate" ? "irrigation may be needed" : "the irrigation threshold has not been reached"}</strong>
                                            <span>
                                                Estimated root-zone depletion: {irrigationAssessment.depletionMm.toFixed(1)} mm of {irrigationAssessment.totalAvailableWaterMm.toFixed(1)} mm total available water
                                                ({(irrigationAssessment.depletionFraction * 100).toFixed(0)}%; this crop's reference threshold is {(irrigationAssessment.allowedDepletionFraction * 100).toFixed(0)}%).
                                            </span>
                                            <span>This estimate applies only to the uploaded row; it is not live or forecasted advice. Verify with a fresh, calibrated reading before irrigating, and reassess at the next scheduled field reading and after rainfall. A fixed reassessment interval and water volume cannot be supported by this dataset.</span>
                                        </div>
                                    )}
                                    <p className="soil-intelligence__source">
                                        Source: <a href={FAO56_SOURCE_URL} target="_blank" rel="noreferrer">FAO Irrigation and Drainage Paper 56, Chapter 8, Table 22</a>. Values apply near ETc 5 mm/day and vary with atmospheric demand, soil texture, and management. This uploaded dataset does not identify validated ETc units or a weather forecast.
                                    </p>
                                </>
                            )}
                        </section>

                        <section className="soil-intelligence__card">
                            <h2>Nutrient and fertilizer assessment</h2>
                            {crop ? (
                                <>
                                    <p>Selected crop: <strong>{crop === "Corn" ? "Corn (maize)" : crop}</strong>. Uploaded N/P/K are displayed as measured; no deficiency label or fertilizer quantity is inferred.</p>
                                    <p className="soil-intelligence__notice">A crop-specific fertilizer recommendation requires a recent, calibrated soil test with extraction method, soil type, field area, crop stage, and locally validated guidance. The dataset provides N/P/K values but not this calibration context or fertilizer decision labels.</p>
                                </>
                            ) : (
                                <p className="soil-intelligence__empty">Select a crop to scope nutrient guidance. No fertilizer recommendation is available without a validated soil-test method and local crop-specific recommendations.</p>
                            )}
                        </section>

                        <details className="soil-intelligence__card soil-intelligence__details">
                            <summary>Dataset import details</summary>
                            <p>Source: uploaded file · real-time sensor connection: not configured · simulated readings: none · forecast model: not trained.</p>
                            <p>{dataset.availableFields.length} recognized columns. Unrecognized columns are retained only in the source file and are not interpreted.</p>
                            {dataset.unsupportedColumns.length > 0 && (
                                <p>Unrecognized columns: {dataset.unsupportedColumns.join(", ")}</p>
                            )}
                        </details>
                    </>
                )}
            </main>
        </div>
    );
};

export default SoilIntelligence;
