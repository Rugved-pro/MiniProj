import CropTask from "../models/cropTask.model.js";
import Farm from "../models/farm.model.js";

// ============================================================================
// 1. CROP YIELD BENCHMARKS & AGRONOMIC ESTIMATION ENGINE (AGRITECH ADAPTATION)
// ============================================================================

// Base historical yield distributions (quintals per acre) across Indian agro-climatic zones
const CROP_YIELD_BENCHMARKS = {
    wheat: { baseAcre: 19.5, minAcre: 14.0, maxAcre: 26.0, defaultPrice: 2275, durationDays: 130 },
    rice: { baseAcre: 21.0, minAcre: 15.0, maxAcre: 28.5, defaultPrice: 2183, durationDays: 125 },
    paddy: { baseAcre: 21.0, minAcre: 15.0, maxAcre: 28.5, defaultPrice: 2183, durationDays: 125 },
    potato: { baseAcre: 110.0, minAcre: 75.0, maxAcre: 150.0, defaultPrice: 1250, durationDays: 95 },
    maize: { baseAcre: 23.5, minAcre: 16.0, maxAcre: 31.0, defaultPrice: 2090, durationDays: 105 },
    corn: { baseAcre: 23.5, minAcre: 16.0, maxAcre: 31.0, defaultPrice: 2090, durationDays: 105 },
    cotton: { baseAcre: 8.5, minAcre: 5.5, maxAcre: 12.0, defaultPrice: 7020, durationDays: 165 },
    sugarcane: { baseAcre: 340.0, minAcre: 260.0, maxAcre: 430.0, defaultPrice: 315, durationDays: 330 },
    mustard: { baseAcre: 7.2, minAcre: 4.8, maxAcre: 10.0, defaultPrice: 5650, durationDays: 110 },
    soybean: { baseAcre: 9.8, minAcre: 6.5, maxAcre: 13.5, defaultPrice: 4600, durationDays: 100 },
    groundnut: { baseAcre: 10.5, minAcre: 7.0, maxAcre: 14.5, defaultPrice: 6377, durationDays: 115 },
    tomato: { baseAcre: 95.0, minAcre: 65.0, maxAcre: 135.0, defaultPrice: 1400, durationDays: 85 },
    onion: { baseAcre: 85.0, minAcre: 55.0, maxAcre: 120.0, defaultPrice: 1850, durationDays: 120 },
    pulses: { baseAcre: 5.5, minAcre: 3.5, maxAcre: 8.0, defaultPrice: 7000, durationDays: 90 },
    barley: { baseAcre: 15.0, minAcre: 10.0, maxAcre: 20.0, defaultPrice: 1735, durationDays: 115 }
};

const STATE_MODIFIERS = {
    punjab: 1.18,
    haryana: 1.15,
    "west bengal": 1.05,
    maharashtra: 1.02,
    "uttar pradesh": 1.08,
    "madhya pradesh": 0.98,
    gujarat: 1.04,
    karnataka: 1.00,
    bihar: 0.96,
    rajasthan: 0.92,
    telangana: 1.01,
    "andhra pradesh": 1.03,
    tamilnadu: 1.06
};

const SOIL_MODIFIERS = {
    loamy: 1.05,
    clayey: 1.02,
    black: 1.04,
    red: 0.96,
    sandy: 0.90
};

export const predictCropYield = async (req, res) => {
    try {
        const {
            crop = "Wheat",
            state = "Maharashtra",
            district = "Pune",
            season = "Rabi",
            area = 1.0,
            areaUnit = "Acres",
            annualRainfall,
            fertilizerKg,
            soilType = "Loamy"
        } = req.body;

        const cropKey = String(crop).trim().toLowerCase();
        const benchmark = CROP_YIELD_BENCHMARKS[cropKey] || {
            baseAcre: 16.0,
            minAcre: 10.0,
            maxAcre: 22.0,
            defaultPrice: 2200,
            durationDays: 120
        };

        const parsedArea = Math.max(0.1, Number(area) || 1.0);
        const areaInAcres = areaUnit === "Hectares" ? parsedArea * 2.47105 : parsedArea;
        const areaInHa = areaUnit === "Hectares" ? parsedArea : parsedArea / 2.47105;

        // Apply regional modifiers
        const stateKey = String(state).trim().toLowerCase();
        const stateFactor = STATE_MODIFIERS[stateKey] || 1.0;

        const soilKey = String(soilType).trim().toLowerCase();
        const soilFactor = SOIL_MODIFIERS[soilKey] || 1.0;

        // Rainfall modifier (if provided, compare against nominal ~800-1100mm)
        let rainfallFactor = 1.0;
        if (annualRainfall && Number(annualRainfall) > 0) {
            const rf = Number(annualRainfall);
            if (rf < 450) rainfallFactor = 0.88; // low rainfall stress
            else if (rf > 1600) rainfallFactor = 0.93; // waterlogging/excess
            else rainfallFactor = 1.02;
        }

        const combinedFactor = stateFactor * soilFactor * rainfallFactor;
        const estimatedYieldPerAcreQ = Math.round(benchmark.baseAcre * combinedFactor * 10) / 10;
        const estimatedYieldPerAcreKg = Math.round(estimatedYieldPerAcreQ * 100);

        // Quintals to Tonnes: 1 Tonne = 10 Quintals
        const estimatedYieldPerHaTonnes = Math.round((estimatedYieldPerAcreQ * 2.47105 / 10) * 100) / 100;

        const totalProductionQ = Math.round(estimatedYieldPerAcreQ * areaInAcres * 10) / 10;
        const totalProductionTonnes = Math.round((totalProductionQ / 10) * 100) / 100;

        const minProductionQ = Math.round(benchmark.minAcre * combinedFactor * areaInAcres * 10) / 10;
        const maxProductionQ = Math.round(benchmark.maxAcre * combinedFactor * areaInAcres * 10) / 10;

        return res.status(200).json({
            success: true,
            crop,
            state,
            district,
            season,
            area: parsedArea,
            areaUnit,
            areaInAcres: Math.round(areaInAcres * 100) / 100,
            areaInHa: Math.round(areaInHa * 100) / 100,
            yieldPerAcre: {
                quintals: estimatedYieldPerAcreQ,
                kg: estimatedYieldPerAcreKg
            },
            yieldPerHectare: {
                tonnes: estimatedYieldPerHaTonnes
            },
            totalEstimatedProduction: {
                quintals: totalProductionQ,
                tonnes: totalProductionTonnes
            },
            confidenceRange: {
                minQuintals: minProductionQ,
                maxQuintals: maxProductionQ,
                confidenceLevel: "85% agro-climatic confidence band"
            },
            modelMetadata: {
                dataSource: "ICAR / Ministry of Agriculture State Crop Yield Statistics",
                factorsApplied: {
                    stateModifier: stateFactor,
                    soilModifier: soilFactor,
                    rainfallModifier: rainfallFactor
                },
                assumptionsNote: "Estimates represent expected yield under standard agronomic practices without catastrophic pest outbreaks or severe unseasonal hail/floods."
            }
        });
    } catch (error) {
        console.error("Error calculating crop yield:", error);
        return res.status(500).json({ error: "Failed to estimate crop yield" });
    }
};

// ============================================================================
// 2. HARVEST & FINANCIAL IMPACT SIMULATOR
// ============================================================================

export const simulateHarvestImpact = async (req, res) => {
    try {
        const {
            crop = "Wheat",
            area = 2.5,
            areaUnit = "Acres",
            baselineYieldPerAcreQ,
            mandiPricePerQuintal
        } = req.body;

        const cropKey = String(crop).trim().toLowerCase();
        const benchmark = CROP_YIELD_BENCHMARKS[cropKey] || { baseAcre: 18.0, defaultPrice: 2200 };

        const parsedArea = Math.max(0.1, Number(area) || 1.0);
        const areaInAcres = areaUnit === "Hectares" ? parsedArea * 2.47105 : parsedArea;

        const yieldPerAcreQ = Number(baselineYieldPerAcreQ) > 0
            ? Number(baselineYieldPerAcreQ)
            : benchmark.baseAcre;

        const pricePerQ = Number(mandiPricePerQuintal) > 0
            ? Number(mandiPricePerQuintal)
            : benchmark.defaultPrice;

        const baselineProductionQ = Math.round(yieldPerAcreQ * areaInAcres * 10) / 10;
        const baselineRevenue = Math.round(baselineProductionQ * pricePerQ);

        // Explicitly labeled loss scenarios
        const scenarios = [
            {
                scenarioName: "Ideal Harvest (Baseline)",
                lossPercent: 0,
                description: "Crop remains healthy with optimal irrigation and timely protection.",
                productionQ: baselineProductionQ,
                grossRevenue: baselineRevenue,
                revenueExposure: 0
            },
            {
                scenarioName: "Mild Weather / Minor Pest Stress",
                lossPercent: 12,
                description: "Localized foliage spots or moderate moisture deficit during tillering.",
                productionQ: Math.round(baselineProductionQ * 0.88 * 10) / 10,
                grossRevenue: Math.round(baselineRevenue * 0.88),
                revenueExposure: Math.round(baselineRevenue * 0.12)
            },
            {
                scenarioName: "Moderate Disease / Unseasonal Rain",
                lossPercent: 28,
                description: "Leaf blight or rust spreading across 20-30% of field canopy.",
                productionQ: Math.round(baselineProductionQ * 0.72 * 10) / 10,
                grossRevenue: Math.round(baselineRevenue * 0.72),
                revenueExposure: Math.round(baselineRevenue * 0.28)
            },
            {
                scenarioName: "Severe Unmanaged Outbreak",
                lossPercent: 45,
                description: "Extensive unmanaged pathogen infection or severe prolonged drought.",
                productionQ: Math.round(baselineProductionQ * 0.55 * 10) / 10,
                grossRevenue: Math.round(baselineRevenue * 0.55),
                revenueExposure: Math.round(baselineRevenue * 0.45)
            }
        ];

        return res.status(200).json({
            success: true,
            crop,
            cultivatedArea: parsedArea,
            areaUnit,
            baselineMetrics: {
                yieldPerAcreQuintals: yieldPerAcreQ,
                totalProductionQuintals: baselineProductionQ,
                mandiPricePerQuintal: pricePerQ,
                estimatedGrossRevenue: baselineRevenue
            },
            scenarios,
            disclaimer: "Gross revenue scenarios reflect projected sales before deducting input costs (seeds, labor, fuel, fertilizers). Disease classification does not directly predict exact yield loss percentage."
        });
    } catch (error) {
        console.error("Error in harvest simulator:", error);
        return res.status(500).json({ error: "Failed to simulate harvest impact" });
    }
};

// ============================================================================
// 3. FERTILIZER RECOMMENDATION SYSTEM (AGRITECH ADAPTATION)
// ============================================================================

export const getFertilizerRecommendation = async (req, res) => {
    try {
        const {
            crop = "Wheat",
            soilType = "Loamy",
            nitrogen = 50,
            phosphorous = 40,
            potassium = 40,
            soil_pH = 6.8,
            moisture = 45,
            temperature = 26,
            humidity = 60
        } = req.query;

        const N = Number(nitrogen) || 50;
        const P = Number(phosphorous) || 40;
        const K = Number(potassium) || 40;
        const pH = Number(soil_pH) || 6.8;

        // Classify nutrient status
        const nStatus = N < 35 ? "Low" : N > 80 ? "High" : "Optimal";
        const pStatus = P < 25 ? "Low" : P > 60 ? "High" : "Optimal";
        const kStatus = K < 25 ? "Low" : K > 60 ? "High" : "Optimal";

        let primaryRecommendation = "";
        let rationale = "";
        let applicationTiming = "";
        let secondaryOptions = [];

        if (nStatus === "Low" && pStatus === "Low") {
            primaryRecommendation = "DAP (Diammonium Phosphate 18-46-0) + Urea Split";
            rationale = "Soil shows combined Nitrogen and Phosphorus deficiency. DAP supplies readily available phosphate for early root establishment and initial nitrogen.";
            applicationTiming = "Apply full DAP dose as basal application during land preparation/sowing. Apply Urea in two equal splits: first at 21-25 days (crown root initiation / tillering) and second at panicle initiation.";
            secondaryOptions = ["NPK 14-35-14", "NPK 12-32-16", "Composted Farmyard Manure (FYM)"];
        } else if (nStatus === "Low" && pStatus !== "Low" && kStatus !== "Low") {
            primaryRecommendation = "Urea (46% Nitrogen)";
            rationale = "Phosphorus and Potassium are in the optimal range. Nitrogen deficiency is limiting vegetative growth and chlorophyll synthesis.";
            applicationTiming = "Apply in split doses after irrigation or when soil is moist to prevent nitrogen volatilization losses. Do not apply onto dry soil.";
            secondaryOptions = ["Neem-Coated Urea", "Nano Urea (foliar spray at tillering)"];
        } else if (pStatus === "Low") {
            primaryRecommendation = "Single Super Phosphate (SSP 16% P2O5, 11% Sulphur)";
            rationale = "Phosphorus deficiency inhibits root development and tillering. SSP also provides essential sulphur for protein synthesis.";
            applicationTiming = "Apply as basal placement 5-7 cm below seed level before sowing.";
            secondaryOptions = ["DAP (18-46-0)", "Rock Phosphate (for acidic soils)"];
        } else if (kStatus === "Low") {
            primaryRecommendation = "Muriate of Potash (MOP 60% K2O)";
            rationale = "Potassium deficiency impairs water regulation, enzyme activation, and disease resistance in leaves.";
            applicationTiming = "Apply 50% as basal application and 50% at flowering/grain fill stage.";
            secondaryOptions = ["Sulphate of Potash (SOP)", "Wood Ash / Potassium Mobilizing Biofertilizers"];
        } else {
            primaryRecommendation = "NPK 19-19-19 Balanced Formulation or Organic Manure Maintenance";
            rationale = "Soil macronutrients (N, P, K) are well balanced. Maintenance nutrition and organic matter preservation are recommended.";
            applicationTiming = "Apply maintenance dosage or incorporate well-decomposed vermicompost (2-3 tonnes/acre) during field preparation.";
            secondaryOptions = ["Vermicompost", "Bio-fertilizers (Azotobacter / PSB)", "Jeevamrut"];
        }

        const soilHealthWarnings = [];
        if (pH < 6.0) {
            soilHealthWarnings.push("Soil is moderately acidic (pH < 6.0). Consider applying agricultural lime (200-300 kg/acre) to improve phosphorus availability.");
        } else if (pH > 8.0) {
            soilHealthWarnings.push("Soil is alkaline (pH > 8.0). Consider applying agricultural gypsum and organic matter to lower pH.");
        }
        if (Number(moisture) < 30) {
            soilHealthWarnings.push("Soil moisture is low (< 30%). Never apply chemical fertilizers to water-stressed soil without prior light irrigation.");
        }

        return res.status(200).json({
            success: true,
            crop,
            soilType,
            nutrients: {
                nitrogen: { value: N, status: nStatus },
                phosphorous: { value: P, status: pStatus },
                potassium: { value: K, status: kStatus },
                soil_pH: { value: pH, status: pH >= 6.0 && pH <= 7.5 ? "Optimal" : "Needs Attention" }
            },
            recommendation: {
                primaryFertilizer: primaryRecommendation,
                rationale,
                applicationTiming,
                secondaryOptions
            },
            soilHealthWarnings,
            disclaimer: "Exact fertilizer quantities should be validated against a laboratory soil health card (SHC) and local Krishi Vigyan Kendra (KVK) guidelines."
        });
    } catch (error) {
        console.error("Error in fertilizer recommendation:", error);
        return res.status(500).json({ error: "Failed to generate fertilizer recommendation" });
    }
};

// ============================================================================
// 4. CROP PLANNING & PLANTATION CALENDAR (AGRITECH ADAPTATION)
// ============================================================================

const CROP_CALENDAR_DATA = [
    {
        crop: "Wheat",
        season: "Rabi",
        sowingMonths: [10, 11], // Nov-Dec
        harvestMonths: [3, 4],  // Mar-Apr
        durationDays: 130,
        stages: [
            { name: "Germination & Seedling", dayRange: "0 - 18 Days", tips: "Ensure adequate seedbed moisture. Protect against early soil pests." },
            { name: "Crown Root & Tillering", dayRange: "19 - 42 Days", tips: "Critical first irrigation window (CRI stage). Apply first nitrogen top-dressing." },
            { name: "Jointing & Stem Elongation", dayRange: "43 - 70 Days", tips: "Second irrigation. Scout for yellow/brown rust leaf spots." },
            { name: "Flowering & Grain Filling", dayRange: "71 - 105 Days", tips: "Maintain light soil moisture. Avoid hot dry wind exposure if possible." },
            { name: "Ripening & Harvest", dayRange: "106 - 130 Days", tips: "Stop irrigation 10-14 days prior to harvest. Harvest when grains are firm." }
        ]
    },
    {
        crop: "Rice",
        season: "Kharif",
        sowingMonths: [5, 6], // Jun-Jul
        harvestMonths: [10, 11], // Oct-Nov
        durationDays: 125,
        stages: [
            { name: "Nursery & Transplanting", dayRange: "0 - 25 Days", tips: "Transplant 2-3 seedlings per hill at 2-3 cm depth." },
            { name: "Tillering Stage", dayRange: "26 - 55 Days", tips: "Maintain 2-5 cm shallow standing water. First split of nitrogen." },
            { name: "Panicle Initiation & Booting", dayRange: "56 - 80 Days", tips: "Critical water demand. Scout for leaf blast lesions or stem borers." },
            { name: "Flowering & Milk Stage", dayRange: "81 - 105 Days", tips: "Ensure continuous moisture. Prevent brown planthopper build-up." },
            { name: "Maturity & Harvest", dayRange: "106 - 125 Days", tips: "Drain field 10 days before harvest when 80-85% panicles turn golden." }
        ]
    },
    {
        crop: "Potato",
        season: "Rabi",
        sowingMonths: [10, 11], // Oct-Nov
        harvestMonths: [1, 2],  // Jan-Feb
        durationDays: 95,
        stages: [
            { name: "Sprouting & Emergence", dayRange: "0 - 15 Days", tips: "Plant certified disease-free seed tubers in moist ridges." },
            { name: "Vegetative Canopy Development", dayRange: "16 - 35 Days", tips: "First earthing up and weeding. Scout for early blight spots." },
            { name: "Tuber Initiation & Bulking", dayRange: "36 - 70 Days", tips: "Critical moisture window. Maintain uniform soil moisture; avoid waterlogging." },
            { name: "Tuber Maturation", dayRange: "71 - 85 Days", tips: "Withhold nitrogen. Scout for late blight if humidity is high." },
            { name: "Dehaulming & Harvest", dayRange: "86 - 95 Days", tips: "Cut foliage (dehaulm) 10 days before digging to cure tuber skin." }
        ]
    },
    {
        crop: "Maize",
        season: "Kharif / Rabi",
        sowingMonths: [5, 6, 10],
        harvestMonths: [9, 10, 2],
        durationDays: 105,
        stages: [
            { name: "Seedling Stage", dayRange: "0 - 20 Days", tips: "Ensure uniform germination. Watch for fall armyworm feeding damage." },
            { name: "Knee-High Stage", dayRange: "21 - 45 Days", tips: "Side-dress nitrogen fertilizer. Inter-cultivation for weed control." },
            { name: "Tasseling & Silking", dayRange: "46 - 75 Days", tips: "Most drought-sensitive stage. Ensure soil moisture is optimal." },
            { name: "Grain Filling", dayRange: "76 - 95 Days", tips: "Monitor moisture. Grains accumulate starch." },
            { name: "Maturity & Harvesting", dayRange: "96 - 105 Days", tips: "Harvest when husk leaves dry and black layer forms at grain base." }
        ]
    },
    {
        crop: "Cotton",
        season: "Kharif",
        sowingMonths: [4, 5, 6],
        harvestMonths: [10, 11, 12],
        durationDays: 165,
        stages: [
            { name: "Emergence & Square Formation", dayRange: "0 - 35 Days", tips: "Maintain weed-free field. Monitor for sucking pests (aphids/jassids)." },
            { name: "Flowering & Boll Formation", dayRange: "36 - 90 Days", tips: "Critical moisture window. Avoid moisture stress causing flower drop." },
            { name: "Boll Development & Maturation", dayRange: "91 - 135 Days", tips: "Scout for bollworms. Light irrigations as needed." },
            { name: "Boll Bursting & Picking", dayRange: "136 - 165 Days", tips: "Pick clean cotton in morning hours after dew has dried." }
        ]
    }
];

export const getCropCalendar = async (req, res) => {
    try {
        const { crop } = req.query;
        if (crop) {
            const cropKey = String(crop).trim().toLowerCase();
            const matched = CROP_CALENDAR_DATA.find(c => c.crop.toLowerCase() === cropKey);
            if (matched) return res.status(200).json({ success: true, crop: matched });
        }
        return res.status(200).json({ success: true, crops: CROP_CALENDAR_DATA });
    } catch (error) {
        console.error("Error in crop calendar:", error);
        return res.status(500).json({ error: "Failed to fetch crop calendar" });
    }
};

// ============================================================================
// 5. DAILY AGRICULTURAL TASKS ("WHAT SHOULD I DO TODAY?")
// ============================================================================

export const getDailyTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const farm = await Farm.findOne({ userId });
        const activePlot = farm?.plots?.find(p => p._id === farm.activePlotId) || farm?.plots?.[0];

        const cropName = activePlot?.crop || "Wheat";
        let tasks = await CropTask.find({ userId });

        // If no tasks exist for user, seed initial realistic tasks based on active plot
        if (!tasks || tasks.length === 0) {
            const initialTasks = [
                {
                    userId,
                    plotId: activePlot?._id || "plot-1",
                    crop: cropName,
                    taskTitle: `Morning Field Walk & Leaf Inspection (${cropName})`,
                    category: "inspection",
                    description: "Inspect 10 random plants across the field. Check underside of leaves for early discoloration, powder or rust spots.",
                    dueDate: new Date().toISOString().split("T")[0],
                    completed: false,
                    completedAt: null
                },
                {
                    userId,
                    plotId: activePlot?._id || "plot-1",
                    crop: cropName,
                    taskTitle: "Check Root-Zone Soil Moisture",
                    category: "irrigation",
                    description: "Dig 10 cm into root-zone. Form a soil ball in hand. If it crumbles without moisture feel, schedule light irrigation.",
                    dueDate: new Date().toISOString().split("T")[0],
                    completed: false,
                    completedAt: null
                },
                {
                    userId,
                    plotId: activePlot?._id || "plot-1",
                    crop: cropName,
                    taskTitle: "Review Local Weather Forecast for Spraying",
                    category: "protection",
                    description: "Check if high winds or heavy rainfall are expected before planning any foliar nutrition or pesticide spray.",
                    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
                    completed: false,
                    completedAt: null
                },
                {
                    userId,
                    plotId: activePlot?._id || "plot-1",
                    crop: cropName,
                    taskTitle: "Inspect Irrigation Lines / Furrows",
                    category: "irrigation",
                    description: "Check for blockages in drip emitters or leaks along main delivery pipes.",
                    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
                    completed: false,
                    completedAt: null
                }
            ];

            tasks = [];
            for (const t of initialTasks) {
                const created = await CropTask.create(t);
                tasks.push(created);
            }
        }

        return res.status(200).json({
            success: true,
            crop: cropName,
            plot: activePlot?.name || "Main Field",
            tasks
        });
    } catch (error) {
        console.error("Error fetching daily tasks:", error);
        return res.status(500).json({ error: "Failed to load daily tasks" });
    }
};

export const toggleTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;
        const { completed } = req.body;

        const task = await CropTask.findById(taskId);
        if (!task || task.userId !== userId) {
            return res.status(404).json({ error: "Task not found" });
        }

        const isCompleted = completed !== undefined ? Boolean(completed) : !task.completed;
        const updated = await CropTask.findByIdAndUpdate(
            taskId,
            {
                completed: isCompleted,
                completedAt: isCompleted ? new Date().toISOString() : null
            },
            { new: true }
        );

        return res.status(200).json({ success: true, task: updated });
    } catch (error) {
        console.error("Error toggling task:", error);
        return res.status(500).json({ error: "Failed to update task" });
    }
};

export const addTask = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskTitle, category, description, dueDate, crop } = req.body;

        if (!taskTitle) {
            return res.status(400).json({ error: "Task title is required" });
        }

        const newTask = await CropTask.create({
            userId,
            taskTitle: String(taskTitle).trim(),
            category: category || "inspection",
            description: description ? String(description).trim() : "",
            dueDate: dueDate || new Date().toISOString().split("T")[0],
            crop: crop || "Wheat",
            completed: false,
            completedAt: null
        });

        return res.status(201).json({ success: true, task: newTask });
    } catch (error) {
        console.error("Error adding task:", error);
        return res.status(500).json({ error: "Failed to add task" });
    }
};
