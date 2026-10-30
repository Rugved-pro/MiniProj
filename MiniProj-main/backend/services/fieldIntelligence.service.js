import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Prediction from "../models/predictions.model.js";
import Product from "../models/marketplace.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAINFALL_SOIL_PATH = path.resolve(__dirname, "../../frontend/src/data/Rainfall_Soil.json");
const RECOMMENDATIONS_PATH = path.resolve(__dirname, "../../ML/recommendations.json");
const ENV_PATH = path.resolve(__dirname, "../.env");

let cachedDistricts = null;
let cachedRecommendations = null;

export function loadDistrictDataset() {
    if (cachedDistricts) return cachedDistricts;
    try {
        const raw = fs.readFileSync(RAINFALL_SOIL_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        cachedDistricts = Array.isArray(parsed?.env_data) ? parsed.env_data : [];
    } catch (err) {
        console.warn("Could not read Rainfall_Soil.json:", err.message);
        cachedDistricts = [];
    }
    return cachedDistricts;
}

export function loadRecommendationsDataset() {
    if (cachedRecommendations) return cachedRecommendations;
    try {
        const raw = fs.readFileSync(RECOMMENDATIONS_PATH, "utf-8");
        cachedRecommendations = JSON.parse(raw);
    } catch (err) {
        console.warn("Could not read recommendations.json:", err.message);
        cachedRecommendations = {};
    }
    return cachedRecommendations;
}

export function listAllDistricts() {
    return loadDistrictDataset().map((d) => d.District);
}

export function getDistrictTelemetry(districtInput = "PUNE") {
    const dataset = loadDistrictDataset();
    const query = String(districtInput || "PUNE").trim().toUpperCase();

    let match = dataset.find((d) => String(d.District).toUpperCase().trim() === query);
    if (!match && query) {
        match = dataset.find((d) => String(d.District).toUpperCase().includes(query));
    }
    if (!match) {
        match = dataset.find((d) => String(d.District).toUpperCase() === "PUNE") || dataset[0] || {
            District: query || "PUNE",
            ACTUAL: 218.5,
            NORMAL: 250.0,
            DEP: -12.6,
            CAT: "NR",
            N: 0.5,
            P: 0.4,
            K: 0.5,
            pH: 6.5
        };
    }

    const pH = Number(match.pH || 6.5);
    let phStatus = "Optimal / Neutral (6.0–7.5)";
    if (pH < 5.5) phStatus = "Strongly Acidic (<5.5) — Consider agricultural lime";
    else if (pH < 6.0) phStatus = "Moderately Acidic (5.5–6.0)";
    else if (pH > 7.8) phStatus = "Alkaline (>7.8) — Monitor micronutrient availability";

    const dep = Number(match.DEP || 0);
    let rainStatus = "Normal Rainfall";
    if (dep > 20) rainStatus = `Above Normal (+${dep.toFixed(1)}%)`;
    else if (dep < -20) rainStatus = `Rainfall Deficit (${dep.toFixed(1)}%)`;

    return {
        district: match.District,
        rainActual: Number(Number(match.ACTUAL || 0).toFixed(1)),
        rainNormal: Number(Number(match.NORMAL || 0).toFixed(1)),
        rainDep: Number(Number(match.DEP || 0).toFixed(1)),
        rainCategory: match.CAT || "NR",
        rainStatus,
        soil_N: Number(Number(match.N || 0).toFixed(2)),
        soil_P: Number(Number(match.P || 0).toFixed(2)),
        soil_K: Number(Number(match.K || 0).toFixed(2)),
        soil_pH: Number(pH.toFixed(2)),
        phStatus
    };
}

const DISTRICT_COORDS_FALLBACK = {
    PUNE: { lat: 18.5204, lon: 73.8567 },
    BANKURA: { lat: 23.2324, lon: 87.0715 },
    BIRBHUM: { lat: 23.8402, lon: 87.6186 },
    HOWRAH: { lat: 22.5958, lon: 88.2636 },
    HOOGHLY: { lat: 22.9012, lon: 88.3899 },
    KOLKATA: { lat: 22.5726, lon: 88.3639 },
    NASHIK: { lat: 19.9975, lon: 73.7898 },
    NAGPUR: { lat: 21.1458, lon: 79.0882 },
    MUMBAI: { lat: 19.0760, lon: 72.8777 },
    DELHI: { lat: 28.6139, lon: 77.2090 }
};

export async function getLiveWeatherAndRisk(districtName = "PUNE") {
    const cleanDistrict = String(districtName || "PUNE").trim().toUpperCase();
    let coords = DISTRICT_COORDS_FALLBACK[cleanDistrict] || { lat: 18.5204, lon: 73.8567 };

    try {
        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanDistrict)}&count=1&language=en&format=json`,
            { signal: AbortSignal.timeout(5000) }
        );
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (Array.isArray(geoData?.results) && geoData.results.length > 0) {
                coords = {
                    lat: geoData.results[0].latitude,
                    lon: geoData.results[0].longitude
                };
            }
        }
    } catch {
        // Use fallback coordinates
    }

    let temperatureC = 27.5;
    let humidity = 68;
    let windSpeed = 8.2;
    let updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
    let source = "Regional Baseline";

    try {
        const params = new URLSearchParams({
            latitude: String(coords.lat),
            longitude: String(coords.lon),
            current: "temperature_2m,relative_humidity_2m,wind_speed_10m",
            timezone: "auto"
        });
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
            signal: AbortSignal.timeout(6000)
        });
        if (weatherRes.ok) {
            const weatherData = await weatherRes.json();
            if (Number.isFinite(weatherData?.current?.temperature_2m)) {
                temperatureC = Number(weatherData.current.temperature_2m.toFixed(1));
                humidity = Number(weatherData.current.relative_humidity_2m);
                windSpeed = Number(weatherData.current.wind_speed_10m || 0);
                updatedAt = weatherData.current.time || updatedAt;
                source = "Open-Meteo Live";
            }
        }
    } catch {
        // Keep baseline values
    }

    const isElevatedFungalRisk = humidity >= 70 && temperatureC >= 20 && temperatureC <= 32;
    const isHeatStressRisk = temperatureC >= 36;

    let riskLevel = "Low";
    let riskTitle = "Microclimate Fungal Risk Low";
    let riskAdvice = "Temperature and humidity are within standard vegetative tolerance. Continue routine scouting and FAO-56 soil moisture checks.";

    if (isElevatedFungalRisk) {
        riskLevel = "Elevated";
        riskTitle = "Elevated Fungal Spore Risk";
        riskAdvice = `High relative humidity (${humidity}%) combined with warm temperature (${temperatureC}°C) favors rust and leaf blight germination. Inspect lower leaf surfaces and avoid evening overhead irrigation.`;
    } else if (isHeatStressRisk) {
        riskLevel = "Moderate (Heat)";
        riskTitle = "Elevated Evapotranspiration / Heat Stress";
        riskAdvice = `High ambient temperature (${temperatureC}°C) increases crop water demand. Check root-zone soil moisture depletion early in the morning.`;
    }

    return {
        district: cleanDistrict,
        temperatureC,
        tempKelvin: Number((temperatureC + 273.15).toFixed(2)),
        humidity,
        windSpeed,
        updatedAt,
        source,
        riskLevel,
        riskTitle,
        riskAdvice
    };
}

export const CROP_FAO56_RULES = {
    Wheat: {
        depletionFraction: 0.55,
        sourceCrop: "Spring/winter wheat",
        defaultRootDepthM: 0.8,
        source: "FAO Irrigation & Drainage Paper 56, Table 22",
        note: "Allow up to 55% of total available soil water depletion before irrigating (ETc ~5 mm/day)."
    },
    Rice: {
        depletionFraction: 0.20,
        sourceCrop: "Paddy Rice",
        defaultRootDepthM: 0.5,
        source: "FAO Irrigation & Drainage Paper 56, Table 22",
        note: "Maintain near saturation (max 20% depletion from saturation) during vegetative and reproductive stages; check ponded water / field-tube depth."
    },
    Potato: {
        depletionFraction: 0.35,
        sourceCrop: "Potato",
        defaultRootDepthM: 0.5,
        source: "FAO Irrigation & Drainage Paper 56, Table 22",
        note: "Shallow-rooted crop sensitive to water stress; irrigate when depletion reaches 35% of available water."
    },
    Corn: {
        depletionFraction: 0.55,
        sourceCrop: "Maize / Corn (grain)",
        defaultRootDepthM: 0.9,
        source: "FAO Irrigation & Drainage Paper 56, Table 22",
        note: "Allow up to 55% depletion during vegetative growth; avoid moisture stress during tasseling and silking."
    },
    Sugarcane: {
        depletionFraction: 0.65,
        sourceCrop: "Sugarcane",
        defaultRootDepthM: 1.2,
        source: "FAO Irrigation & Drainage Paper 56, Table 22",
        note: "Deep-rooted perennial; allow up to 65% depletion during vegetative/grand growth, reduce irrigation during ripening."
    }
};

export function evaluateSoilIrrigation({
    crop = "Wheat",
    moisturePercent = null,
    fieldCapacity = 32,
    wiltingPoint = 14,
    rootDepth = null
}) {
    const matchedKey = Object.keys(CROP_FAO56_RULES).find(
        (k) => k.toLowerCase() === String(crop || "Wheat").trim().toLowerCase()
    ) || "Wheat";
    const rule = CROP_FAO56_RULES[matchedKey];
    const depth = Number(rootDepth) > 0 ? Number(rootDepth) : rule.defaultRootDepthM;
    const fc = Number(fieldCapacity) || 32;
    const wp = Number(wiltingPoint) || 14;
    const tawMm = (fc - wp) * 10 * depth;
    const rawThresholdMm = rule.depletionFraction * tawMm;
    const triggerMoisturePct = fc - rule.depletionFraction * (fc - wp);

    if (moisturePercent === null || moisturePercent === undefined || moisturePercent === "" || Number.isNaN(Number(moisturePercent))) {
        return {
            crop: matchedKey,
            rule,
            hasReading: false,
            fieldCapacity: fc,
            wiltingPoint: wp,
            rootDepth: depth,
            totalAvailableWaterMm: Number(tawMm.toFixed(1)),
            thresholdMm: Number(rawThresholdMm.toFixed(1)),
            triggerMoisturePct: Number(triggerMoisturePct.toFixed(1))
        };
    }

    const moisture = Number(moisturePercent);
    const depletionMm = Math.max(0, Math.min(tawMm, (fc - moisture) * 10 * depth));
    const depletionFraction = tawMm > 0 ? depletionMm / tawMm : 0;
    const shouldIrrigate = depletionFraction >= rule.depletionFraction;

    return {
        crop: matchedKey,
        rule,
        hasReading: true,
        currentMoisture: moisture,
        fieldCapacity: fc,
        wiltingPoint: wp,
        rootDepth: depth,
        totalAvailableWaterMm: Number(tawMm.toFixed(1)),
        depletionMm: Number(depletionMm.toFixed(1)),
        thresholdMm: Number(rawThresholdMm.toFixed(1)),
        depletionPct: Number((depletionFraction * 100).toFixed(1)),
        allowedDepletionPct: Number((rule.depletionFraction * 100).toFixed(0)),
        triggerMoisturePct: Number(triggerMoisturePct.toFixed(1)),
        status: shouldIrrigate ? "IRRIGATE NOW" : "POSTPONE IRRIGATION",
        recommendation: shouldIrrigate
            ? `Soil moisture (${moisture}%) is below the FAO-56 threshold (${triggerMoisturePct.toFixed(1)}%). Depletion is ${(depletionFraction * 100).toFixed(1)}% (limit ${(rule.depletionFraction * 100).toFixed(0)}%). Irrigate approximately ${depletionMm.toFixed(0)} mm to restore root zone to field capacity.`
            : `Soil moisture (${moisture}%) is adequate (above threshold ${triggerMoisturePct.toFixed(1)}%). Current depletion is ${(depletionFraction * 100).toFixed(1)}% vs ${(rule.depletionFraction * 100).toFixed(0)}% threshold. Postpone irrigation to prevent waterlogging.`
    };
}

export async function getRegionalForecast(districtName = "PUNE") {
    const telemetry = getDistrictTelemetry(districtName);
    const weather = await getLiveWeatherAndRisk(telemetry.district);
    const apiUrl = process.env.ML_URL || "http://127.0.0.1:8000";

    const payload = {
        rain: telemetry.rainActual || 250,
        soil_N: telemetry.soil_N || 0.5,
        soil_P: telemetry.soil_P || 0.4,
        soil_K: telemetry.soil_K || 0.5,
        soil_pH: telemetry.soil_pH || 6.5,
        temp: weather.tempKelvin || 300.15,
        hum: weather.humidity || 68
    };

    let crops = [];
    let diseases = [];

    try {
        const res = await fetch(`${apiUrl}/analysis`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
            const data = await res.json();
            crops = data?.predictions?.crops || [];
            diseases = data?.predictions?.diseases || [];
        }
    } catch {
        // Fallback below
    }

    if (crops.length === 0) {
        if (payload.rain > 250) crops.push("Rice", "Sugarcane");
        else crops.push("Wheat", "Corn");
        if (payload.soil_pH >= 5.5 && payload.soil_pH <= 7.5) crops.push("Potato");
    }
    if (diseases.length === 0) {
        if (payload.hum > 70) diseases.push("Leaf_Blast", "Common_Rust");
        else if (payload.rain > 280) diseases.push("Red_Rot", "Late_Blight");
        else diseases.push("Brown_Rust", "Early_Blight");
    }

    return {
        telemetry,
        weather,
        recommendedCrops: crops,
        proneDiseases: diseases
    };
}

export async function getFarmerFieldContext(user, overrideDistrict = null) {
    let predictions = [];
    if (user?._id) {
        predictions = await Prediction.find({ userId: String(user._id) });
        predictions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const latestScan = predictions[0] || null;
    const effectiveDistrict = overrideDistrict || user?.district || latestScan?.location || "PUNE";
    const telemetry = getDistrictTelemetry(effectiveDistrict);
    const weather = await getLiveWeatherAndRisk(telemetry.district);

    const diseaseFrequency = {};
    const pesticideFrequency = {};
    for (const p of predictions) {
        if (p.disease) {
            diseaseFrequency[p.disease] = (diseaseFrequency[p.disease] || 0) + 1;
        }
        if (Array.isArray(p.pesticides)) {
            for (const pest of p.pesticides) {
                pesticideFrequency[pest] = (pesticideFrequency[pest] || 0) + 1;
            }
        }
    }

    return {
        user,
        district: telemetry.district,
        telemetry,
        weather,
        recentScans: predictions.slice(0, 5),
        totalScans: predictions.length,
        diseaseFrequency,
        pesticideFrequency
    };
}

export async function getMarketplaceItems(limit = 6) {
    try {
        const items = await Product.find({});
        return items.slice(0, limit);
    } catch {
        return [];
    }
}

export function searchDiseaseKnowledge(text = "") {
    const recomms = loadRecommendationsDataset();
    const q = String(text || "").toLowerCase();
    const matches = [];

    for (const [key, val] of Object.entries(recomms)) {
        const [crop, disease] = key.split("___");
        const readableDisease = (disease || "").replace(/_/g, " ");
        if (
            q.includes(crop.toLowerCase()) ||
            q.includes(readableDisease.toLowerCase()) ||
            readableDisease.toLowerCase().split(" ").some((w) => w.length > 3 && q.includes(w))
        ) {
            matches.push({
                key,
                crop,
                disease: readableDisease,
                details: val.disease_details || [],
                recommendations: val.recommendations || [],
                pesticides: val.pesticides || []
            });
        }
    }
    return matches;
}

export async function generateGroundedChatReply({ messages = [], fieldContext = null }) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    let contextBlock = "";
    if (fieldContext) {
        const { user, telemetry, weather, recentScans } = fieldContext;
        const scanLines = (recentScans || []).slice(0, 3).map(
            (s, i) => `  ${i + 1}. Crop: ${s.crop}, Diagnosis: ${s.disease}, Location: ${s.location}, Pesticides: ${(s.pesticides || []).join(", ") || "None"}`
        ).join("\n");

        contextBlock = [
            "\n\n--- LINKED FARMER FIELD CONTEXT ---",
            user ? `Farmer Name: ${user.name} | Phone: ${user.phoneno} | Grown Crops: ${(user.crops || []).join(", ") || "Not specified"}` : "Unlinked Farmer Session",
            `Active Field District: ${telemetry?.district || "PUNE"}`,
            `District Soil Telemetry: N=${telemetry?.soil_N}, P=${telemetry?.soil_P}, K=${telemetry?.soil_K}, Soil pH=${telemetry?.soil_pH} (${telemetry?.phStatus})`,
            `District Rainfall: Actual=${telemetry?.rainActual}mm, Normal=${telemetry?.rainNormal}mm, Departure=${telemetry?.rainDep}% (${telemetry?.rainStatus})`,
            `Live Weather (${weather?.source}): Temp=${weather?.temperatureC}°C, Humidity=${weather?.humidity}%, Wind=${weather?.windSpeed} km/h`,
            `Microclimate Risk Status: ${weather?.riskTitle} — ${weather?.riskAdvice}`,
            scanLines ? `Recent Crop Leaf Scans:\n${scanLines}` : "Recent Crop Leaf Scans: None recorded yet."
        ].join("\n");
    }

    const knowledgeMatches = searchDiseaseKnowledge(lastUserMsg);
    if (knowledgeMatches.length > 0) {
        const kLines = knowledgeMatches.slice(0, 4).map(
            (m) => `- ${m.crop} (${m.disease}): ${m.details.join(" ")} | Advice: ${m.recommendations.join(" ")} | Pesticides: ${m.pesticides.join(", ")}`
        ).join("\n");
        contextBlock += `\n\n--- CERES DISEASE DATABASE MATCHES ---\n${kLines}`;
    }

    const systemPrompt = [
        "You are Ceres (KisanSahayak), an evidence-based agricultural intelligence assistant for farmers in India.",
        "Answer clearly, practically, and in the same language the farmer uses (English, Hindi, Marathi, etc.).",
        "When the farmer asks about their field, weather, soil, crops, or recent disease scans, use the LINKED FARMER FIELD CONTEXT provided below to give personalized, specific numbers and advice.",
        "Keep answers concise and well-structured for mobile reading (use bullet points).",
        "For pesticides/fungicides, remind the farmer to follow product label dosage and verify with their local Krishi Vigyan Kendra (KVK).",
        contextBlock
    ].join(" ");

    const rawApiKey = (process.env.GEMINI_API_KEY || "").trim().replace(/^["']|["']$/g, "");
    if (rawApiKey) {
        const configuredModel = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
        const modelsToTry = [
            configuredModel,
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-3.5-flash",
            "gemini-1.5-flash"
        ].filter((v, i, a) => v && a.indexOf(v) === i);

        const requestBody = JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: messages.slice(-10).map(({ role, content }) => ({
                role: role === "assistant" ? "model" : "user",
                parts: [{ text: String(content || "").trim() }]
            })),
            generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 1200
            }
        });

        for (const model of modelsToTry) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": rawApiKey
                        },
                        body: requestBody,
                        signal: AbortSignal.timeout(12000)
                    }
                );

                if (response.ok) {
                    const result = await response.json();
                    const answer = result.candidates?.[0]?.content?.parts
                        ?.filter((part) => !part.thought)
                        .map((part) => part.text || "")
                        .join("")
                        .trim();
                    if (answer) {
                        return { reply: answer, source: "gemini" };
                    }
                } else if (response.status === 401 || response.status === 403) {
                    break;
                }
            } catch {
                // Try next model or local grounded intelligence
            }
        }
    }

    // Grounded Agricultural Intelligence Fallback (ensures 100% uptime using real field & ML data)
    return {
        reply: buildGroundedFieldFallbackReply(lastUserMsg, fieldContext, knowledgeMatches),
        source: "ceres-grounded-engine"
    };
}

function buildGroundedFieldFallbackReply(query, fieldContext, knowledgeMatches = []) {
    const q = String(query || "").toLowerCase();
    const user = fieldContext?.user;
    const telemetry = fieldContext?.telemetry || getDistrictTelemetry("PUNE");
    const weather = fieldContext?.weather;
    const recentScans = fieldContext?.recentScans || [];

    const greeting = user?.name ? `Namaste ${user.name}!` : "Namaste Kisan!";

    // 1. Check if asking in Hindi / Devanagari
    const isHindi = /[\u0900-\u097F]/.test(query) || q.includes("kya") || q.includes("fasal") || q.includes("khet");
    if (isHindi) {
        const latest = recentScans[0];
        return [
            `🌾 **नमस्ते ${user?.name || "किसान मित्र"}! (Ceres कृषि सहायक)**`,
            "",
            `📍 **आपका क्षेत्र:** ${telemetry.district}`,
            weather ? `🌡️ **मौसम:** तापमान ${weather.temperatureC}°C | नमी (Humidity) ${weather.humidity}%` : "",
            `🧪 **मिट्टी की स्थिति:** pH ${telemetry.soil_pH} (${telemetry.phStatus}), N: ${telemetry.soil_N}, P: ${telemetry.soil_P}, K: ${telemetry.soil_K}`,
            "",
            "**फफूंद (Fungal Disease) व फसल सुरक्षा के मुख्य उपाय:**",
            "• **लक्षण:** पत्तियों पर पीले/भूरे धब्बे (Rust) या झुलसा (Blight) के निशान मुख्य रूप से अधिक नमी (>70%) में बढ़ते हैं।",
            "• **जैविक और कृषि उपाय:**",
            "  1. खेत में जलभराव न होने दें और FAO-56 नियमों के अनुसार ही सिंचाई करें।",
            "  2. शुरुआती लक्षण दिखने पर नीम तेल (Neem Oil 10000 ppm) या ट्राइकोडर्मा (Trichoderma viride) का प्रयोग करें।",
            "  3. गंभीर संक्रमण में Mancozeb 75% WP या Propiconazole 25% EC का छिड़काव कृषि विज्ञान केंद्र (KVK) की सलाह से करें।",
            latest ? `\n📋 **आपकी पिछली फसल जांच:** ${latest.crop} — ${latest.disease.replace(/_/g, " ")} (अनुशंसित: ${(latest.pesticides || []).join(", ") || "सामान्य देखभाल"})` : ""
        ].filter(Boolean).join("\n");
    }

    // 2. If disease/crop matches found in recommendations.json
    if (knowledgeMatches.length > 0) {
        const top = knowledgeMatches.slice(0, 2);
        const lines = [
            `${greeting} Here is the grounded Ceres assessment for your query:`,
            ""
        ];
        for (const m of top) {
            lines.push(`🌱 **${m.crop} — ${m.disease}**`);
            for (const d of m.details) lines.push(`• ${d}`);
            lines.push(`**Recommended Management:**`);
            for (const r of m.recommendations) lines.push(`  - ${r}`);
            if (m.pesticides.length > 0) {
                lines.push(`**Suggested Fungicides / Treatments:** ${m.pesticides.join(", ")} _(verify dosage on product label / local KVK)_`);
            }
            lines.push("");
        }
        if (weather) {
            lines.push(`🌦️ **Current Field Risk in ${telemetry.district}:** ${weather.riskTitle} (${weather.temperatureC}°C, ${weather.humidity}% RH).`);
        }
        return lines.join("\n").trim();
    }

    // 3. If asking about soil moisture / irrigation / FAO-56
    if (q.includes("soil") || q.includes("moisture") || q.includes("irrigat") || q.includes("water") || q.includes("fao") || q.includes("ph") || q.includes("npk")) {
        const primaryCrop = user?.crops?.[0] || "Wheat";
        const sim = evaluateSoilIrrigation({ crop: primaryCrop });
        return [
            `${greeting} Here is your **Soil & FAO-56 Irrigation Intelligence** for **${telemetry.district}**:`,
            "",
            `🧪 **District Soil Benchmark (${telemetry.district}):**`,
            `• **Soil pH:** ${telemetry.soil_pH} (${telemetry.phStatus})`,
            `• **Nutrient Indices:** Nitrogen (N): ${telemetry.soil_N} | Phosphorus (P): ${telemetry.soil_P} | Potassium (K): ${telemetry.soil_K}`,
            `• **Rainfall:** ${telemetry.rainActual} mm actual vs ${telemetry.rainNormal} mm normal (${telemetry.rainStatus})`,
            "",
            `💧 **FAO-56 Depletion Rule (${sim.crop}):**`,
            `• **Allowed Depletion Fraction (p):** ${(sim.rule.depletionFraction * 100).toFixed(0)}% of Total Available Water`,
            `• **Trigger Threshold:** Irrigate when volumetric soil moisture drops below **${sim.triggerMoisturePct}%** (assuming FC=${sim.fieldCapacity}%, WP=${sim.wiltingPoint}%)`,
            `• **Note:** ${sim.rule.note}`
        ].join("\n");
    }

    // 4. If asking about weather, temperature, humidity, or risk
    if (q.includes("weather") || q.includes("temp") || q.includes("rain") || q.includes("humid") || q.includes("risk") || q.includes("climate")) {
        return [
            `${greeting} Here is the live microclimate & field risk report for **${telemetry.district}**:`,
            "",
            `🌡️ **Temperature:** ${weather ? `${weather.temperatureC}°C` : "27.5°C"}`,
            `💧 **Relative Humidity:** ${weather ? `${weather.humidity}%` : "68%"}`,
            `🌧️ **Seasonal Rainfall:** ${telemetry.rainActual} mm (Normal: ${telemetry.rainNormal} mm, ${telemetry.rainStatus})`,
            `⚠️ **Fungal Risk Status:** ${weather ? weather.riskTitle : "Low"}`,
            `• ${weather ? weather.riskAdvice : "Inspect lower leaves regularly."}`
        ].join("\n");
    }

    // 5. General field summary & guidance
    const latestScan = recentScans[0];
    return [
        `${greeting} I am **Ceres**, your agricultural intelligence assistant.`,
        "",
        `📍 **Your Active Field Summary (${telemetry.district}):**`,
        user?.crops?.length ? `• **Registered Crops:** ${user.crops.join(", ")}` : "• **Supported Crops:** Wheat, Rice, Corn, Potato, Sugarcane",
        weather ? `• **Live Microclimate:** ${weather.temperatureC}°C, ${weather.humidity}% Humidity (${weather.riskTitle})` : "",
        `• **Soil Profile:** pH ${telemetry.soil_pH} | N: ${telemetry.soil_N}, P: ${telemetry.soil_P}, K: ${telemetry.soil_K}`,
        latestScan
            ? `• **Latest Leaf Scan:** ${latestScan.crop} — **${latestScan.disease.replace(/_/g, " ")}** ${latestScan.pesticides?.length ? `(Treatments: ${latestScan.pesticides.join(", ")})` : ""}`
            : "• **Leaf Scans:** Send a crop leaf photo anytime for instant ViT disease diagnosis!",
        "",
        "💡 **What you can ask me:**",
        "• _\"What are the symptoms and treatment for wheat brown rust or rice blast?\"_",
        "• _\"How does soil moisture affect irrigation under FAO-56?\"_",
        "• _\"What is my current field weather and fungal risk?\"_",
        "• Or send a **photo of a crop leaf** directly in Telegram for instant disease detection!"
    ].filter(Boolean).join("\n");
}

export function updateEnvFile(key, value) {
    let content = "";
    if (fs.existsSync(ENV_PATH)) {
        content = fs.readFileSync(ENV_PATH, "utf-8");
    }
    const lines = content.split(/\r?\n/);
    let found = false;
    const updatedLines = lines.map((line) => {
        if (line.trim().startsWith(`${key}=`)) {
            found = true;
            return `${key}=${value}`;
        }
        return line;
    });
    if (!found) {
        if (updatedLines.length > 0 && updatedLines[updatedLines.length - 1] !== "") {
            updatedLines.push(`${key}=${value}`);
        } else {
            updatedLines[Math.max(0, updatedLines.length - 1)] = `${key}=${value}`;
        }
    }
    fs.writeFileSync(ENV_PATH, updatedLines.join("\n") + "\n", "utf-8");
    process.env[key] = value;
}
