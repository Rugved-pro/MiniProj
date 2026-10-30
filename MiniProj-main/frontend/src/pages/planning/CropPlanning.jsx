import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    RiCalendarCheckLine,
    RiTimeLine,
    RiFlaskLine,
    RiAddLine,
    RiCheckboxCircleFill,
    RiCheckboxBlankCircleLine,
    RiAlertLine,
    RiInformationLine,
    RiLeafLine,
    RiCheckLine,
    RiArrowRightLine
} from "react-icons/ri";
import { FaCalendarAlt, FaSeedling, FaWater, FaCheckCircle, FaUndo } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Exactly the 8 required crops
const SUPPORTED_CROPS = [
    "Wheat",
    "Rice",
    "Tomato",
    "Potato",
    "Onion",
    "Maize",
    "Cotton",
    "Soybean"
];

const GROWTH_STAGES = [
    "Seedling / Germination",
    "Vegetative / Tillering",
    "Flowering / Heading",
    "Grain Fill / Pod / Tuber Bulking",
    "Maturity / Ripening / Harvesting"
];

// Predefined robust ICAR crop schedules for all 8 crops
const CROP_SCHEDULES = {
    Wheat: {
        crop: "Wheat",
        season: "Rabi (Winter)",
        durationDays: 120,
        stages: [
            { name: "Germination & Seedling", dayRange: "0 - 18 Days", tips: "Ensure adequate seedbed moisture. Protect against early soil cutworms and termites." },
            { name: "Crown Root Initiation & Tillering", dayRange: "19 - 42 Days", tips: "Critical first irrigation window (CRI stage at ~21 days). Apply first split of nitrogen top-dressing." },
            { name: "Jointing & Stem Elongation", dayRange: "43 - 70 Days", tips: "Second irrigation window. Scout for yellow/brown rust leaf spots and broadleaf weeds." },
            { name: "Flowering & Grain Filling", dayRange: "71 - 100 Days", tips: "Maintain light soil moisture. Avoid hot dry wind exposure during pollination; check for aphid colonies." },
            { name: "Ripening & Harvest", dayRange: "101 - 120 Days", tips: "Stop irrigation 10-14 days prior to harvest. Harvest when grain moisture drops to ~12-14%." }
        ]
    },
    Rice: {
        crop: "Rice",
        season: "Kharif (Monsoon)",
        durationDays: 135,
        stages: [
            { name: "Nursery & Transplanting", dayRange: "0 - 25 Days", tips: "Transplant 2-3 seedlings per hill at 2-3 cm depth in well-puddled field." },
            { name: "Tillering Stage", dayRange: "26 - 55 Days", tips: "Maintain 2-5 cm shallow standing water. Apply first split of urea with zinc sulfate." },
            { name: "Panicle Initiation & Booting", dayRange: "56 - 85 Days", tips: "Peak water demand stage. Scout for leaf blast lesions, stem borer dead hearts, and bacterial leaf blight." },
            { name: "Flowering & Milk Stage", dayRange: "86 - 115 Days", tips: "Ensure continuous moisture. Prevent brown planthopper (BPH) build-up at base of tillers." },
            { name: "Maturity & Harvest", dayRange: "116 - 135 Days", tips: "Drain standing water 10 days before harvest when 80-85% panicles turn golden straw color." }
        ]
    },
    Tomato: {
        crop: "Tomato",
        season: "Kharif / Rabi",
        durationDays: 110,
        stages: [
            { name: "Nursery & Transplanting", dayRange: "0 - 20 Days", tips: "Harden seedlings before field planting. Irrigate lightly immediately after transplanting." },
            { name: "Vegetative & Staking", dayRange: "21 - 45 Days", tips: "Stake plants to support vine growth and keep foliage off damp soil. Prune lower side shoots." },
            { name: "Flowering & Fruit Set", dayRange: "46 - 70 Days", tips: "Ensure steady calcium and potassium nutrition. Avoid irregular watering to prevent blossom end rot." },
            { name: "Fruit Enlargement & Ripening", dayRange: "71 - 95 Days", tips: "Scout for tomato fruit borer and early/late blight on leaves. Maintain uniform soil moisture." },
            { name: "Harvesting & Grading", dayRange: "96 - 110 Days", tips: "Pick firm breaker/pink stage fruits for distant transport, red ripe for local consumption." }
        ]
    },
    Potato: {
        crop: "Potato",
        season: "Rabi (Winter)",
        durationDays: 95,
        stages: [
            { name: "Sprouting & Emergence", dayRange: "0 - 15 Days", tips: "Plant certified disease-free seed tubers in moist ridges. Protect against cutworms." },
            { name: "Vegetative Canopy Development", dayRange: "16 - 35 Days", tips: "First earthing up and weeding. Scout for early blight spots and aphid vectors." },
            { name: "Tuber Initiation & Bulking", dayRange: "36 - 70 Days", tips: "Critical moisture window. Maintain uniform soil moisture; avoid waterlogging or soil crusting." },
            { name: "Tuber Maturation", dayRange: "71 - 85 Days", tips: "Withhold nitrogen. Scout for late blight if humidity is high; apply prophylactic copper spray." },
            { name: "Dehaulming & Harvest", dayRange: "86 - 95 Days", tips: "Cut foliage (dehaulm) 10-12 days before digging to cure tuber skin and prevent bruising." }
        ]
    },
    Onion: {
        crop: "Onion",
        season: "Rabi / Kharif",
        durationDays: 140,
        stages: [
            { name: "Nursery & Seedling Growth", dayRange: "0 - 45 Days", tips: "Maintain light regular watering in raised seedbeds. Protect against damping-off." },
            { name: "Transplanting & Establishment", dayRange: "46 - 70 Days", tips: "Transplant 6-8 week old seedlings at 15x10 cm spacing in well-pulverized beds." },
            { name: "Vegetative Leaf Foliage", dayRange: "71 - 95 Days", tips: "Apply balanced NPK top-dressing. Scout for thrips on leaf necks and purple blotch." },
            { name: "Bulb Initiation & Development", dayRange: "96 - 125 Days", tips: "Critical watering stage. Stop nitrogen application to prevent thick neck development." },
            { name: "Neck Fall & Harvesting", dayRange: "126 - 140 Days", tips: "Stop irrigation 15 days before harvest when 50% tops fall naturally. Field cure bulbs under shade." }
        ]
    },
    Maize: {
        crop: "Maize",
        season: "Kharif / Rabi",
        durationDays: 105,
        stages: [
            { name: "Seedling Stage", dayRange: "0 - 20 Days", tips: "Ensure uniform germination. Watch for fall armyworm feeding damage in leaf whorls." },
            { name: "Knee-High Stage", dayRange: "21 - 45 Days", tips: "Side-dress nitrogen fertilizer. Inter-cultivation for weed control and earthing up." },
            { name: "Tasseling & Silking", dayRange: "46 - 75 Days", tips: "Most drought-sensitive stage. Ensure soil moisture is optimal for pollen shedding and silk emergence." },
            { name: "Grain Filling", dayRange: "76 - 90 Days", tips: "Monitor moisture. Grains accumulate starch. Scout for cob borer damage." },
            { name: "Maturity & Harvesting", dayRange: "91 - 105 Days", tips: "Harvest when husk leaves dry and black layer forms at grain base." }
        ]
    },
    Cotton: {
        crop: "Cotton",
        season: "Kharif (Monsoon)",
        durationDays: 160,
        stages: [
            { name: "Emergence & Square Formation", dayRange: "0 - 35 Days", tips: "Maintain weed-free field. Monitor for sucking pests (aphids, jassids, thrips)." },
            { name: "Flowering & Boll Formation", dayRange: "36 - 90 Days", tips: "Critical moisture window. Avoid moisture stress causing flower and young square drop." },
            { name: "Boll Development & Maturation", dayRange: "91 - 130 Days", tips: "Scout for pink bollworm and American bollworm. Light irrigations as needed." },
            { name: "Boll Bursting & Picking", dayRange: "131 - 160 Days", tips: "Pick clean cotton in morning hours after dew has dried. Avoid trash contamination." }
        ]
    },
    Soybean: {
        crop: "Soybean",
        season: "Kharif (Monsoon)",
        durationDays: 100,
        stages: [
            { name: "Germination & Emergence", dayRange: "0 - 15 Days", tips: "Inoculate seeds with Rhizobium culture. Ensure well-drained, moist seedbed." },
            { name: "Vegetative Branching", dayRange: "16 - 35 Days", tips: "Keep field weed-free during first 30 days. Inspect for stem fly or girdle beetle." },
            { name: "Flowering & Pod Initiation", dayRange: "36 - 60 Days", tips: "Moisture stress at flowering causes flower drop. Avoid soil waterlogging." },
            { name: "Pod Filling & Seed Enlargement", dayRange: "61 - 85 Days", tips: "Maintain adequate moisture for seed density. Scout for pod borers or rust." },
            { name: "Maturity & Pod Drying", dayRange: "86 - 100 Days", tips: "Harvest when 90% leaves shed and pods turn golden yellow; harvest promptly to avoid pod shattering." }
        ]
    }
};

// 6 standard actionable tasks dynamically customized by crop
function getStandardTasks(crop, stage) {
    return [
        {
            id: `task-1-${crop}`,
            title: `Inspect Leaves for Spots & Curling (${crop})`,
            category: "Inspection",
            recommendedTime: "Morning (7:00 AM – 9:00 AM)",
            explanation: `Examine upper and lower leaf surfaces on 10 random ${crop} plants. Early detection of rust, blight, or aphid clusters prevents widespread yield loss.`
        },
        {
            id: `task-2-${crop}`,
            title: `Check Root-Zone Soil Moisture (${crop})`,
            category: "Soil Moisture",
            recommendedTime: "Morning (8:00 AM – 10:00 AM)",
            explanation: "Dig down 10-15 cm near root zone and perform hand-feel ball test. Confirms if irrigation is truly needed before operating pumps."
        },
        {
            id: `task-3-${crop}`,
            title: `Review Irrigation & Drainage Schedule (${crop})`,
            category: "Irrigation",
            recommendedTime: "Before 11:00 AM",
            explanation: `Current growth stage (${stage}) requires balanced hydration. Check weather forecast to prevent waterlogging if rain is expected.`
        },
        {
            id: `task-4-${crop}`,
            title: `Check Pest Symptoms & Underside of Foliage`,
            category: "Crop Protection",
            recommendedTime: "Midday (11:00 AM – 1:00 PM)",
            explanation: "Scout for sucking pests, caterpillar holes, or stem damage. Warm midday sun often reveals early canopy wilting or pest feeding."
        },
        {
            id: `task-5-${crop}`,
            title: `Review Fertilizer & Nutrient Needs (${crop})`,
            category: "Nutrients",
            recommendedTime: "Late Afternoon (4:00 PM – 6:00 PM)",
            explanation: `Verify top-dressing schedule for ${crop}. Avoid applying high nitrogen during extreme heat or moisture stress.`
        },
        {
            id: `task-6-${crop}`,
            title: `Prepare for the Next Growth Stage`,
            category: "Stage Transition",
            recommendedTime: "Evening (5:30 PM – 7:00 PM)",
            explanation: "Clean field furrows, check input supplies, and prepare equipment for the upcoming stage milestones."
        }
    ];
}

export default function CropPlanning() {
    const { activePlot, plots, setActivePlotId } = useFarmContext();

    const [activeTab, setActiveTab] = useState("tasks"); // 'tasks', 'calendar', 'fertilizer'

    // Form selection states
    const [selectedPlotId, setSelectedPlotId] = useState(activePlot?._id || "plot-default");
    const [selectedCrop, setSelectedCrop] = useState(activePlot?.crop || "Wheat");
    const [selectedStage, setSelectedStage] = useState(activePlot?.growthStage || "Vegetative / Tillering");

    // Sowing Date (defaults to 25 days ago for realistic demo)
    const [sowingDate, setSowingDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 25);
        return d.toISOString().split("T")[0];
    });

    // Custom Tasks added by farmer
    const [customTasks, setCustomTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskCategory, setNewTaskCategory] = useState("Inspection");
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Persistence: Task Completion Map keyed by task id
    const [completedTasks, setCompletedTasks] = useState(() => {
        try {
            const saved = localStorage.getItem("ceres_task_completions");
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Save completions to localStorage
    const handleToggleTask = (taskId) => {
        setCompletedTasks(prev => {
            const next = { ...prev, [taskId]: !prev[taskId] };
            try {
                localStorage.setItem("ceres_task_completions", JSON.stringify(next));
            } catch {
                // Ignore storage errors
            }
            const isDone = next[taskId];
            toast.success(isDone ? "Task marked complete! Great job." : "Task reopened.");
            return next;
        });
    };

    // Fertilizer State
    const [fertForm, setFertForm] = useState({
        crop: selectedCrop,
        soilType: activePlot?.soilType || "Loamy",
        nitrogen: 45,
        phosphorous: 35,
        potassium: 40,
        soil_pH: 6.8,
        moisture: 45
    });
    const [fertResult, setFertResult] = useState(null);
    const [isLoadingFert, setIsLoadingFert] = useState(false);

    // Sync when crop or activePlot changes
    useEffect(() => {
        if (activePlot) {
            if (activePlot.crop && SUPPORTED_CROPS.includes(activePlot.crop)) {
                setSelectedCrop(activePlot.crop);
            }
            if (activePlot.growthStage) {
                setSelectedStage(activePlot.growthStage);
            }
            if (activePlot._id) {
                setSelectedPlotId(activePlot._id);
            }
        }
    }, [activePlot]);

    // Active crop schedule
    const activeSchedule = useMemo(() => {
        return CROP_SCHEDULES[selectedCrop] || CROP_SCHEDULES.Wheat;
    }, [selectedCrop]);

    // Calculate Dynamic Harvest Date & Growing Progress
    const harvestCalculation = useMemo(() => {
        if (!sowingDate) return null;
        const sown = new Date(sowingDate);
        if (isNaN(sown.getTime())) return null;

        const duration = activeSchedule.durationDays;
        const harvest = new Date(sown);
        harvest.setDate(harvest.getDate() + duration);

        const today = new Date();
        const diffMs = today.getTime() - sown.getTime();
        const daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        const daysRemaining = Math.max(0, duration - daysElapsed);
        const percentComplete = Math.min(100, Math.round((daysElapsed / duration) * 100));

        return {
            expectedHarvestDate: harvest.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            }),
            rawHarvestDate: harvest.toISOString().split("T")[0],
            daysElapsed,
            daysRemaining,
            percentComplete,
            durationDays: duration
        };
    }, [sowingDate, activeSchedule]);

    // Standard 6 Actionable Tasks for current crop & stage
    const standardTasks = useMemo(() => {
        return getStandardTasks(selectedCrop, selectedStage);
    }, [selectedCrop, selectedStage]);

    // Add Custom Task
    const handleAddCustomTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask = {
            id: `custom-${Date.now()}`,
            title: newTaskTitle.trim(),
            category: newTaskCategory,
            recommendedTime: "Today",
            explanation: `Custom field task scheduled for ${selectedCrop}.`
        };

        setCustomTasks(prev => [newTask, ...prev]);
        setNewTaskTitle("");
        setIsAddingTask(false);
        toast.success("New farm task added");
    };

    // Run fertilizer recommendation
    const handleRunFertilizer = async (e) => {
        if (e) e.preventDefault();
        setIsLoadingFert(true);
        try {
            const params = new URLSearchParams({ ...fertForm, crop: selectedCrop });
            const res = await fetch(`${API_BASE}/intelligence/fertilizer?${params.toString()}`);
            const data = await res.json();
            if (res.ok && data.recommendation) {
                setFertResult(data);
            }
        } catch {
            // Offline fallback
            setFertResult({
                nutrients: {
                    nitrogen: { value: fertForm.nitrogen, status: fertForm.nitrogen < 50 ? "Low" : "Medium" },
                    phosphorous: { value: fertForm.phosphorous, status: fertForm.phosphorous < 30 ? "Low" : "Optimal" },
                    potassium: { value: fertForm.potassium, status: fertForm.potassium < 40 ? "Low" : "Optimal" },
                    soil_pH: { value: fertForm.soil_pH, status: "Optimal" }
                },
                recommendation: {
                    primaryFertilizer: `${selectedCrop} Special Balanced Formulation`,
                    rationale: `Soil test indicates nitrogen (${fertForm.nitrogen} kg/ha) requires top-dressing. Phosphate and potash levels are adequate for vegetative expansion.`,
                    applicationTiming: "Apply 50% basal at sowing, remaining 50% split equally at Crown Root / Tillering and Flowering."
                }
            });
        } finally {
            setIsLoadingFert(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#590907]/10 via-[#E8D2B5]/30 to-[#A5A79B]/20 border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-bold mb-2">
                                <FaCalendarAlt className="text-xs" />
                                <span>CROP PLANNING &amp; DAILY FARM CALENDAR</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Field Crop Planning &amp; Daily Checklist
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Sowing timeline, expected harvest date, and daily actionable checklist tailored for your plots.
                            </p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm text-xs">
                            <button
                                type="button"
                                onClick={() => setActiveTab("tasks")}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "tasks"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                What Should I Do Today?
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("calendar")}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "calendar"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Growing Calendar &amp; Harvest
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab("fertilizer");
                                    handleRunFertilizer();
                                }}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "fertilizer"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Fertilizer Advisor
                            </button>
                        </div>
                    </div>
                </div>

                {/* SAMPLE GUIDANCE NOTICE */}
                <div className="mb-6 p-3.5 rounded-xl bg-[#E8D2B5]/30 border border-[#A5A79B]/40 text-xs text-[#545850] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <RiInformationLine className="text-[#590907] text-base shrink-0" />
                        <span>
                            <strong>Sample Guidance:</strong> Illustrative agricultural schedule based on ICAR package of practices, not universal agricultural prescriptions.
                        </span>
                    </div>
                    <span className="hidden md:inline px-2 py-0.5 rounded bg-white font-bold text-[#590907] border border-[#A5A79B]/30 text-[11px]">
                        8 Crops Supported
                    </span>
                </div>

                {/* TOP INTERACTIVE CONTROLS: PLOT, CROP, SOWING DATE & GROWTH STAGE */}
                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 mb-8 shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* 1. Farm / Plot Selector */}
                        <div>
                            <label className="block font-bold text-[#590907] uppercase tracking-wider mb-1.5">
                                Select Farm Plot
                            </label>
                            <select
                                value={selectedPlotId}
                                onChange={(e) => {
                                    setSelectedPlotId(e.target.value);
                                    if (setActivePlotId) setActivePlotId(e.target.value);
                                    const match = plots?.find(p => p._id === e.target.value);
                                    if (match && match.crop && SUPPORTED_CROPS.includes(match.crop)) {
                                        setSelectedCrop(match.crop);
                                    }
                                }}
                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none focus:border-[#590907]"
                            >
                                {plots && plots.length > 0 ? (
                                    plots.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} ({p.crop || "Wheat"} • {p.area} {p.areaUnit})
                                        </option>
                                    ))
                                ) : (
                                    <option value="plot-default">Main Field (2.5 Acres)</option>
                                )}
                            </select>
                        </div>

                        {/* 2. Crop Selector (Strictly 8 Crops) */}
                        <div>
                            <label className="block font-bold text-[#590907] uppercase tracking-wider mb-1.5">
                                Select Crop (8 Supported)
                            </label>
                            <select
                                value={selectedCrop}
                                onChange={(e) => setSelectedCrop(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-bold text-[#590907] outline-none focus:border-[#590907]"
                            >
                                {SUPPORTED_CROPS.map((crop) => (
                                    <option key={crop} value={crop}>
                                        {crop} ({CROP_SCHEDULES[crop]?.durationDays || 120} Days)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Sowing Date Picker */}
                        <div>
                            <label className="block font-bold text-[#590907] uppercase tracking-wider mb-1.5">
                                Sowing Date
                            </label>
                            <input
                                type="date"
                                required
                                value={sowingDate}
                                onChange={(e) => setSowingDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none focus:border-[#590907]"
                            />
                        </div>

                        {/* 4. Growth Stage Selector */}
                        <div>
                            <label className="block font-bold text-[#590907] uppercase tracking-wider mb-1.5">
                                Current Growth Stage
                            </label>
                            <select
                                value={selectedStage}
                                onChange={(e) => setSelectedStage(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none focus:border-[#590907]"
                            >
                                {GROWTH_STAGES.map((stg) => (
                                    <option key={stg} value={stg}>
                                        {stg}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* DYNAMIC HARVEST & GROWING PROGRESS STRIP */}
                    {harvestCalculation && (
                        <div className="mt-5 pt-4 border-t border-[#A5A79B]/25 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="p-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold">
                                    <span>Expected Harvest: </span>
                                    <span className="text-emerald-900 text-sm ml-1">{harvestCalculation.expectedHarvestDate}</span>
                                </div>
                                <div className="text-[#545850]">
                                    <span>Cycle: </span>
                                    <strong className="text-[#1C1E1B]">{harvestCalculation.durationDays} Days</strong>
                                    <span className="mx-2">•</span>
                                    <span>Elapsed: </span>
                                    <strong className="text-[#1C1E1B]">{harvestCalculation.daysElapsed} Days</strong>
                                    <span className="mx-2">•</span>
                                    <span>Remaining: </span>
                                    <strong className="text-[#590907]">{harvestCalculation.daysRemaining} Days</strong>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full md:w-64 flex flex-col gap-1">
                                <div className="flex justify-between text-[11px] text-[#545850] font-semibold">
                                    <span>Growing Progress</span>
                                    <span>{harvestCalculation.percentComplete}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#E8D2B5]/50 overflow-hidden">
                                    <div
                                        className="h-full bg-[#590907] transition-all duration-300 rounded-full"
                                        style={{ width: `${harvestCalculation.percentComplete}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* TAB 1: WHAT SHOULD I DO TODAY? (ACTIONABLE CHECKLIST) */}
                {activeTab === "tasks" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Task List Column */}
                        <div className="lg:col-span-8 space-y-4">
                            <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-center pb-4 border-b border-[#A5A79B]/30 mb-5">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                            Daily Field Action Items
                                        </span>
                                        <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                            Tasks for {selectedCrop} ({selectedStage})
                                        </h2>
                                        <p className="text-xs text-[#545850] mt-0.5">
                                            Check off completed items or undo at any time. Changes persist automatically.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddingTask(!isAddingTask)}
                                        className="px-3.5 py-1.5 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold flex items-center gap-1 shadow hover:bg-[#420605] transition shrink-0"
                                    >
                                        <RiAddLine className="text-sm" />
                                        <span>Add Task</span>
                                    </button>
                                </div>

                                {/* Add Custom Task Form */}
                                {isAddingTask && (
                                    <form onSubmit={handleAddCustomTask} className="p-4 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/40 mb-6 space-y-3 text-xs">
                                        <h3 className="font-bold text-[#1C1E1B]">Schedule Custom Field Task</h3>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Apply zinc sulfate top-dressing before rain"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white outline-none focus:border-[#590907]"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={newTaskCategory}
                                                onChange={(e) => setNewTaskCategory(e.target.value)}
                                                className="px-3 py-1.5 rounded-xl border border-[#A5A79B]/50 bg-white outline-none focus:border-[#590907]"
                                            >
                                                <option value="Inspection">Field Inspection</option>
                                                <option value="Irrigation">Watering / Irrigation</option>
                                                <option value="Nutrients">Fertilizer Application</option>
                                                <option value="Protection">Pest &amp; Disease Protection</option>
                                            </select>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold"
                                            >
                                                Save Task
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingTask(false)}
                                                className="px-3 py-1.5 rounded-full border border-[#A5A79B]/50 text-[#545850]"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Checklist Items */}
                                <div className="space-y-3">
                                    {[...customTasks, ...standardTasks].map((task) => {
                                        const isDone = !!completedTasks[task.id];
                                        return (
                                            <div
                                                key={task.id}
                                                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                                                    isDone
                                                        ? "bg-emerald-50/40 border-emerald-300/60 opacity-80"
                                                        : "bg-[#FDFBF7] border-[#A5A79B]/40 hover:border-[#590907]/40 shadow-xs"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3.5 flex-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTask(task.id)}
                                                        className="mt-0.5 text-2xl shrink-0 transition"
                                                        title={isDone ? "Undo Task" : "Mark as Completed"}
                                                    >
                                                        {isDone ? (
                                                            <RiCheckboxCircleFill className="text-emerald-700" />
                                                        ) : (
                                                            <RiCheckboxBlankCircleLine className="text-[#A5A79B] hover:text-[#590907]" />
                                                        )}
                                                    </button>

                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <h4 className={`text-sm font-bold ${isDone ? "line-through text-[#545850]" : "text-[#1C1E1B]"}`}>
                                                                {task.title}
                                                            </h4>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8D2B5]/50 text-[#590907]">
                                                                {task.category}
                                                            </span>
                                                        </div>

                                                        {/* Short Explanation: Why this matters today */}
                                                        <p className="text-xs text-[#545850] leading-relaxed mb-2">
                                                            <strong className="text-[#1C1E1B]">Why today: </strong>
                                                            {task.explanation}
                                                        </p>

                                                        {/* Recommended Date / Time */}
                                                        <div className="flex items-center gap-2 text-[11px] text-[#545850]">
                                                            <span className="flex items-center gap-1 font-semibold text-[#590907]">
                                                                <RiTimeLine /> {task.recommendedTime}
                                                            </span>
                                                            {isDone && (
                                                                <span className="text-emerald-700 font-bold ml-2">
                                                                    ✓ Completed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Undo / Complete Action Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleTask(task.id)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition border ${
                                                        isDone
                                                            ? "bg-white border-[#A5A79B]/40 text-[#545850] hover:text-[#590907]"
                                                            : "bg-[#590907] border-[#590907] text-[#FDFBF7] hover:bg-[#420605]"
                                                    }`}
                                                >
                                                    {isDone ? "Undo" : "Mark Done"}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Stage Information & Agronomic Tips */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                                    Selected Stage Focus
                                </span>
                                <h3 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                    {selectedStage}
                                </h3>
                                <p className="text-xs text-[#545850] mt-1">
                                    Crop: <strong>{selectedCrop}</strong> ({activeSchedule.season})
                                </p>

                                <div className="mt-4 p-4 rounded-xl bg-[#E8D2B5]/30 border border-[#A5A79B]/40 text-xs text-[#545850] space-y-2.5">
                                    <div className="flex items-center gap-2 text-[#590907] font-bold">
                                        <FaSeedling />
                                        <span>Key Agronomic Focus:</span>
                                    </div>
                                    <p className="leading-relaxed">
                                        Active stage for {selectedCrop}. Ensure root hydration without water stagnation. Scout lower canopy regularly for leaf symptoms.
                                    </p>
                                </div>

                                <div className="mt-4 p-3.5 rounded-xl bg-white border border-[#A5A79B]/30 text-xs text-[#545850] space-y-1.5">
                                    <div className="flex justify-between">
                                        <span>Total Duration:</span>
                                        <strong className="text-[#1C1E1B]">{activeSchedule.durationDays} Days</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sown On:</span>
                                        <strong className="text-[#1C1E1B]">{sowingDate}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Expected Harvest:</span>
                                        <strong className="text-[#590907]">{harvestCalculation?.expectedHarvestDate || "--"}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: GROWING CALENDAR & MILESTONES */}
                {activeTab === "calendar" && (
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#A5A79B]/30">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                    ICAR Package of Practices Timeline
                                </span>
                                <h2 className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                    {selectedCrop} Growing Calendar &amp; Milestones
                                </h2>
                                <p className="text-xs text-[#545850] mt-1">
                                    Full cycle progression from sowing on {sowingDate} to harvest on {harvestCalculation?.expectedHarvestDate}.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1.5 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/40 text-xs">
                                    <span className="text-[#545850]">Season: </span>
                                    <strong className="text-[#590907]">{activeSchedule.season}</strong>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/40 text-xs">
                                    <span className="text-[#545850]">Duration: </span>
                                    <strong className="text-[#1C1E1B]">{activeSchedule.durationDays} Days</strong>
                                </div>
                            </div>
                        </div>

                        {/* Stage Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {activeSchedule.stages.map((stage, idx) => (
                                <div
                                    key={stage.name}
                                    className="p-5 rounded-2xl border border-[#A5A79B]/35 bg-[#FDFBF7] shadow-xs flex flex-col justify-between hover:border-[#590907]/40 transition"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-extrabold text-[#590907] uppercase tracking-widest px-2 py-0.5 rounded bg-[#E8D2B5]/40">
                                                Stage {idx + 1} of {activeSchedule.stages.length}
                                            </span>
                                            <span className="text-xs font-bold text-[#545850]">
                                                {stage.dayRange}
                                            </span>
                                        </div>

                                        <h4 className="font-serif font-bold text-base text-[#1C1E1B] mb-2">
                                            {stage.name}
                                        </h4>

                                        <p className="text-xs text-[#545850] leading-relaxed border-t border-[#A5A79B]/20 pt-2.5">
                                            {stage.tips}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-[#A5A79B]/20 flex items-center justify-between text-[11px] text-[#545850]">
                                        <span>Status</span>
                                        <span className="font-semibold text-[#590907]">
                                            {selectedStage.toLowerCase().includes(stage.name.toLowerCase().split(" ")[0])
                                                ? "● Active Current Stage"
                                                : "Scheduled"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB 3: NUTRIENT & FERTILIZER ADVISOR */}
                {activeTab === "fertilizer" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-5 bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-serif font-bold text-[#1C1E1B] mb-1">
                                Soil Test &amp; Nutrient Inputs
                            </h2>
                            <p className="text-xs text-[#545850] mb-5">
                                Enter your laboratory soil test values (in kg/ha or test levels 0-140) to determine optimal fertilizer formulation for {selectedCrop}.
                            </p>

                            <form onSubmit={handleRunFertilizer} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Crop</label>
                                    <select
                                        value={selectedCrop}
                                        onChange={(e) => {
                                            setSelectedCrop(e.target.value);
                                            setFertForm({ ...fertForm, crop: e.target.value });
                                        }}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none font-bold text-[#590907]"
                                    >
                                        {SUPPORTED_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Soil Type</label>
                                    <select
                                        value={fertForm.soilType}
                                        onChange={(e) => setFertForm({ ...fertForm, soilType: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                    >
                                        <option value="Loamy">Loamy Soil</option>
                                        <option value="Clayey">Clayey Soil</option>
                                        <option value="Black">Black Soil (Regur)</option>
                                        <option value="Red">Red Soil</option>
                                        <option value="Sandy">Sandy Loam</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Nitrogen (N)</label>
                                        <input
                                            type="number"
                                            value={fertForm.nitrogen}
                                            onChange={(e) => setFertForm({ ...fertForm, nitrogen: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Phosphorus (P)</label>
                                        <input
                                            type="number"
                                            value={fertForm.phosphorous}
                                            onChange={(e) => setFertForm({ ...fertForm, phosphorous: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Potassium (K)</label>
                                        <input
                                            type="number"
                                            value={fertForm.potassium}
                                            onChange={(e) => setFertForm({ ...fertForm, potassium: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Soil pH</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={fertForm.soil_pH}
                                            onChange={(e) => setFertForm({ ...fertForm, soil_pH: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Soil Moisture (%)</label>
                                        <input
                                            type="number"
                                            value={fertForm.moisture}
                                            onChange={(e) => setFertForm({ ...fertForm, moisture: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoadingFert}
                                    className="w-full py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold shadow hover:bg-[#420605] transition flex items-center justify-center gap-2"
                                >
                                    <RiFlaskLine />
                                    <span>{isLoadingFert ? "Calculating Dosage..." : "Calculate Fertilizer Dosage"}</span>
                                </button>
                            </form>
                        </div>

                        {/* Result */}
                        <div className="lg:col-span-7 space-y-4">
                            {fertResult ? (
                                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
                                    <div className="pb-3 border-b border-[#A5A79B]/30 flex justify-between items-center">
                                        <h3 className="font-serif font-bold text-lg text-[#1C1E1B]">
                                            Fertilizer Recommendation for {selectedCrop}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                                            Calculated
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gradient-to-r from-[#590907]/10 to-[#E8D2B5]/30 border border-[#A5A79B]/40">
                                        <span className="font-bold text-[#590907] block mb-1">Recommended Formulation:</span>
                                        <p className="text-sm font-serif font-bold text-[#1C1E1B]">
                                            {fertResult.recommendation?.primaryFertilizer}
                                        </p>
                                        <p className="text-[#545850] mt-2 leading-relaxed">
                                            {fertResult.recommendation?.rationale}
                                        </p>
                                    </div>

                                    {fertResult.recommendation?.applicationTiming && (
                                        <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                                            <span className="font-bold text-[#1C1E1B] block mb-1">Application Schedule:</span>
                                            <p className="text-[#545850] leading-relaxed">
                                                {fertResult.recommendation.applicationTiming}
                                            </p>
                                        </div>
                                    )}

                                    {fertResult.nutrients && (
                                        <div className="grid grid-cols-4 gap-2 pt-2">
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#A5A79B]/30 text-center">
                                                <span className="text-[#545850] block">Nitrogen</span>
                                                <strong className="text-[#1C1E1B]">{fertResult.nutrients.nitrogen?.value} kg/ha</strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#A5A79B]/30 text-center">
                                                <span className="text-[#545850] block">Phosphorus</span>
                                                <strong className="text-[#1C1E1B]">{fertResult.nutrients.phosphorous?.value} kg/ha</strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#A5A79B]/30 text-center">
                                                <span className="text-[#545850] block">Potassium</span>
                                                <strong className="text-[#1C1E1B]">{fertResult.nutrients.potassium?.value} kg/ha</strong>
                                            </div>
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] border border-[#A5A79B]/30 text-center">
                                                <span className="text-[#545850] block">Soil pH</span>
                                                <strong className="text-[#1C1E1B]">{fertResult.nutrients.soil_pH?.value}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-8 text-center text-xs text-[#545850]">
                                    Click "Calculate Fertilizer Dosage" to generate tailored fertilizer timing and dosage.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
