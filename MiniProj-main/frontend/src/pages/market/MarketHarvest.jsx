import { useState, useMemo, useEffect } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    RiFundsLine,
    RiBookmarkLine,
    RiBookmarkFill,
    RiSearchLine,
    RiInformationLine,
    RiArrowRightUpLine,
    RiCalculatorLine,
    RiBarChartBoxLine
} from "react-icons/ri";
import { FaRupeeSign, FaBalanceScale, FaWarehouse, FaCheck } from "react-icons/fa";

// Exactly the 8 required crops
const SUPPORTED_CROPS = [
    "Wheat",
    "Rice",
    "Tomato",
    "Onion",
    "Potato",
    "Maize",
    "Soybean",
    "Cotton"
];

// Typical expected yield presets per acre (in Quintals)
const DEFAULT_YIELD_PRESETS = {
    Wheat: 19.5,
    Rice: 22.0,
    Tomato: 110.0,
    Onion: 85.0,
    Potato: 95.0,
    Maize: 24.0,
    Soybean: 10.5,
    Cotton: 9.5
};

// Default benchmark modal prices per quintal (₹)
const DEFAULT_CROP_PRICES = {
    Wheat: 2450,
    Rice: 3200,
    Tomato: 1350,
    Onion: 1850,
    Potato: 1250,
    Maize: 2150,
    Soybean: 4650,
    Cotton: 7150
};

// Comprehensive offline, self-contained illustrative Indian mandi price dataset
const OFFLINE_MANDI_DATASET = [
    // Wheat
    { commodity: "Wheat", state: "Maharashtra", district: "Pune", market: "Pune APMC", min_price: 2350, max_price: 2650, modal_price: 2450, date: "30 Oct 2026", variety: "Lokwan / Sharbati" },
    { commodity: "Wheat", state: "Punjab", district: "Ludhiana", market: "Khanna APMC", min_price: 2275, max_price: 2420, modal_price: 2350, date: "30 Oct 2026", variety: "HD 3086" },
    { commodity: "Wheat", state: "Uttar Pradesh", district: "Agra", market: "Agra APMC", min_price: 2300, max_price: 2550, modal_price: 2420, date: "30 Oct 2026", variety: "Dara" },
    { commodity: "Wheat", state: "Madhya Pradesh", district: "Indore", market: "Indore Mandi", min_price: 2400, max_price: 2800, modal_price: 2580, date: "30 Oct 2026", variety: "Sharbati Gold" },
    { commodity: "Wheat", state: "Rajasthan", district: "Kota", market: "Kota APMC", min_price: 2280, max_price: 2480, modal_price: 2380, date: "30 Oct 2026", variety: "Raj 4037" },

    // Rice
    { commodity: "Rice", state: "Maharashtra", district: "Pune", market: "Pune APMC", min_price: 2800, max_price: 3600, modal_price: 3200, date: "30 Oct 2026", variety: "Kolam / Indrayani" },
    { commodity: "Rice", state: "Punjab", district: "Amritsar", market: "Amritsar APMC", min_price: 3600, max_price: 4400, modal_price: 4100, date: "30 Oct 2026", variety: "Basmati 1121" },
    { commodity: "Rice", state: "West Bengal", district: "Burdwan", market: "Burdwan Sadar", min_price: 2200, max_price: 2750, modal_price: 2450, date: "30 Oct 2026", variety: "Minikit / Swarna" },
    { commodity: "Rice", state: "Haryana", district: "Karnal", market: "Karnal APMC", min_price: 3500, max_price: 4200, modal_price: 3850, date: "30 Oct 2026", variety: "Pusa Basmati" },
    { commodity: "Rice", state: "Andhra Pradesh", district: "East Godavari", market: "Kakinada", min_price: 2183, max_price: 2500, modal_price: 2320, date: "30 Oct 2026", variety: "BPT 5204" },

    // Tomato
    { commodity: "Tomato", state: "Maharashtra", district: "Nashik", market: "Pimpalgaon APMC", min_price: 1100, max_price: 1650, modal_price: 1350, date: "30 Oct 2026", variety: "Hybrid Red" },
    { commodity: "Tomato", state: "Karnataka", district: "Kolar", market: "Kolar Mandi", min_price: 1200, max_price: 1750, modal_price: 1450, date: "30 Oct 2026", variety: "Desi / Sahu" },
    { commodity: "Tomato", state: "Andhra Pradesh", district: "Chittoor", market: "Madanapalle APMC", min_price: 1050, max_price: 1550, modal_price: 1280, date: "30 Oct 2026", variety: "Hybrid Solid" },
    { commodity: "Tomato", state: "Rajasthan", district: "Jaipur", market: "Jaipur (Muhana)", min_price: 1150, max_price: 1600, modal_price: 1380, date: "30 Oct 2026", variety: "Hybrid" },

    // Onion
    { commodity: "Onion", state: "Maharashtra", district: "Nashik", market: "Lasalgaon Mandi", min_price: 1450, max_price: 2250, modal_price: 1850, date: "30 Oct 2026", variety: "Red Onion" },
    { commodity: "Onion", state: "Maharashtra", district: "Pune", market: "Pune APMC", min_price: 1500, max_price: 2200, modal_price: 1880, date: "30 Oct 2026", variety: "Medium Red" },
    { commodity: "Onion", state: "Madhya Pradesh", district: "Neemuch", market: "Neemuch Mandi", min_price: 1350, max_price: 2050, modal_price: 1720, date: "30 Oct 2026", variety: "Nasik Quality" },
    { commodity: "Onion", state: "Rajasthan", district: "Alwar", market: "Alwar APMC", min_price: 1400, max_price: 2100, modal_price: 1780, date: "30 Oct 2026", variety: "Red Globe" },

    // Potato
    { commodity: "Potato", state: "Uttar Pradesh", district: "Agra", market: "Agra Mandi", min_price: 1050, max_price: 1450, modal_price: 1250, date: "30 Oct 2026", variety: "Kufri Bahar" },
    { commodity: "Potato", state: "Maharashtra", district: "Pune", market: "Pune APMC", min_price: 1150, max_price: 1600, modal_price: 1380, date: "30 Oct 2026", variety: "Jyoti" },
    { commodity: "Potato", state: "West Bengal", district: "Hooghly", market: "Sheoraphuly", min_price: 980, max_price: 1380, modal_price: 1190, date: "30 Oct 2026", variety: "Jyoti Common" },
    { commodity: "Potato", state: "Punjab", district: "Jalandhar", market: "Jalandhar Mandi", min_price: 1020, max_price: 1420, modal_price: 1210, date: "30 Oct 2026", variety: "Kufri Pukhraj" },

    // Maize
    { commodity: "Maize", state: "Maharashtra", district: "Aurangabad", market: "Aurangabad APMC", min_price: 1980, max_price: 2320, modal_price: 2150, date: "30 Oct 2026", variety: "Yellow Hybrid" },
    { commodity: "Maize", state: "Madhya Pradesh", district: "Chhindwara", market: "Chhindwara Mandi", min_price: 1950, max_price: 2280, modal_price: 2100, date: "30 Oct 2026", variety: "Dry Yellow" },
    { commodity: "Maize", state: "Karnataka", district: "Davanagere", market: "Davanagere APMC", min_price: 2020, max_price: 2380, modal_price: 2200, date: "30 Oct 2026", variety: "Commercial Yellow" },
    { commodity: "Maize", state: "Bihar", district: "Purnea", market: "Gulabbagh APMC", min_price: 2050, max_price: 2420, modal_price: 2240, date: "30 Oct 2026", variety: "Rabi Yellow" },

    // Soybean
    { commodity: "Soybean", state: "Maharashtra", district: "Latur", market: "Latur APMC", min_price: 4350, max_price: 4880, modal_price: 4650, date: "30 Oct 2026", variety: "Yellow Soybean" },
    { commodity: "Soybean", state: "Madhya Pradesh", district: "Indore", market: "Indore Mandi", min_price: 4400, max_price: 4950, modal_price: 4700, date: "30 Oct 2026", variety: "JS 335" },
    { commodity: "Soybean", state: "Madhya Pradesh", district: "Ujjain", market: "Ujjain APMC", min_price: 4320, max_price: 4850, modal_price: 4620, date: "30 Oct 2026", variety: "Yellow Commercial" },
    { commodity: "Soybean", state: "Rajasthan", district: "Kota", market: "Kota Mandi", min_price: 4380, max_price: 4900, modal_price: 4680, date: "30 Oct 2026", variety: "Yellow Seed" },

    // Cotton
    { commodity: "Cotton", state: "Maharashtra", district: "Nagpur", market: "Nagpur APMC", min_price: 6850, max_price: 7450, modal_price: 7150, date: "30 Oct 2026", variety: "Medium Staple" },
    { commodity: "Cotton", state: "Gujarat", district: "Rajkot", market: "Rajkot APMC", min_price: 6900, max_price: 7550, modal_price: 7240, date: "30 Oct 2026", variety: "Shankar-6" },
    { commodity: "Cotton", state: "Punjab", district: "Bathinda", market: "Bathinda Mandi", min_price: 6950, max_price: 7600, modal_price: 7300, date: "30 Oct 2026", variety: "American Cotton" },
    { commodity: "Cotton", state: "Telangana", district: "Warangal", market: "Warangal APMC", min_price: 6820, max_price: 7480, modal_price: 7180, date: "30 Oct 2026", variety: "Long Staple" }
];

// Historical 7-day modal price trend simulator (for simple trend chart)
function get7DayPriceTrend(basePrice) {
    const days = ["24 Oct", "25 Oct", "26 Oct", "27 Oct", "28 Oct", "29 Oct", "30 Oct"];
    const variations = [-40, -15, 20, 10, -25, 15, 0];
    return days.map((day, i) => ({
        day,
        price: basePrice + variations[i]
    }));
}

export default function MarketHarvest() {
    const { activePlot } = useFarmContext();

    const [activeTab, setActiveTab] = useState("calculator"); // 'calculator', 'simulator', 'mandi'

    // Mandi Filters State
    const [selectedCropFilter, setSelectedCropFilter] = useState("All");
    const [selectedStateFilter, setSelectedStateFilter] = useState("All");
    const [marketSearchText, setMarketSearchText] = useState("");

    // Watchlist State persisted in localStorage
    const [watchlist, setWatchlist] = useState(() => {
        try {
            const saved = localStorage.getItem("ceres_mandi_watchlist");
            return saved ? JSON.parse(saved) : ["Pune APMC-Wheat", "Lasalgaon Mandi-Onion"];
        } catch {
            return [];
        }
    });

    const toggleWatchlist = (key) => {
        setWatchlist((prev) => {
            const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
            try {
                localStorage.setItem("ceres_mandi_watchlist", JSON.stringify(next));
            } catch {
                // Ignore storage errors
            }
            toast.success(next.includes(key) ? "Added to watchlist" : "Removed from watchlist");
            return next;
        });
    };

    // Harvest Calculator State
    const [calcCrop, setCalcCrop] = useState(activePlot?.crop || "Wheat");
    const [calcArea, setCalcArea] = useState(activePlot?.area || 2.5);
    const [calcYieldPerAcre, setCalcYieldPerAcre] = useState(DEFAULT_YIELD_PRESETS[activePlot?.crop] || 19.5);
    const [calcPricePerQuintal, setCalcPricePerQuintal] = useState(DEFAULT_CROP_PRICES[activePlot?.crop] || 2450);

    // Update yield preset & default price when crop changes
    const handleCropChange = (newCrop) => {
        setCalcCrop(newCrop);
        if (DEFAULT_YIELD_PRESETS[newCrop]) {
            setCalcYieldPerAcre(DEFAULT_YIELD_PRESETS[newCrop]);
        }
        if (DEFAULT_CROP_PRICES[newCrop]) {
            setCalcPricePerQuintal(DEFAULT_CROP_PRICES[newCrop]);
        }
    };

    // Harvest Calculations
    const totalProductionQ = useMemo(() => {
        return Math.round(Number(calcArea) * Number(calcYieldPerAcre) * 10) / 10;
    }, [calcArea, calcYieldPerAcre]);

    const totalProductionTonnes = useMemo(() => {
        return Math.round((totalProductionQ / 10) * 100) / 100;
    }, [totalProductionQ]);

    const baselineGrossRevenue = useMemo(() => {
        return Math.round(totalProductionQ * Number(calcPricePerQuintal));
    }, [totalProductionQ, calcPricePerQuintal]);

    // Harvest-Loss Simulator State
    const [selectedLossPercent, setSelectedLossPercent] = useState(0); // 0, 10, 20, 30, or custom
    const [customLossInput, setCustomLossInput] = useState(15);

    const activeLossPercent = selectedLossPercent === "custom" ? Number(customLossInput) || 0 : Number(selectedLossPercent);

    // Simulator Scenarios Comparison (0%, 10%, 20%, 30%, custom)
    const simulatedResults = useMemo(() => {
        const scenarios = [0, 10, 20, 30];
        if (selectedLossPercent === "custom" && !scenarios.includes(activeLossPercent)) {
            scenarios.push(activeLossPercent);
            scenarios.sort((a, b) => a - b);
        }

        return scenarios.map((pct) => {
            const lostQ = Math.round((totalProductionQ * (pct / 100)) * 10) / 10;
            const remainingQ = Math.round((totalProductionQ - lostQ) * 10) / 10;
            const remainingTonnes = Math.round((remainingQ / 10) * 100) / 100;
            const lostTonnes = Math.round((lostQ / 10) * 100) / 100;
            const remainingRevenue = Math.round(remainingQ * Number(calcPricePerQuintal));
            const revenueDifference = Math.max(0, baselineGrossRevenue - remainingRevenue);

            return {
                lossPercent: pct,
                label: pct === 0 ? "0% Loss (Baseline)" : `-${pct}% Loss`,
                lostQ,
                remainingQ,
                remainingTonnes,
                lostTonnes,
                remainingRevenue,
                revenueDifference
            };
        });
    }, [totalProductionQ, calcPricePerQuintal, baselineGrossRevenue, selectedLossPercent, activeLossPercent]);

    // Active single scenario for detailed highlight
    const activeScenarioDetails = useMemo(() => {
        const pct = activeLossPercent;
        const lostQ = Math.round((totalProductionQ * (pct / 100)) * 10) / 10;
        const remainingQ = Math.round((totalProductionQ - lostQ) * 10) / 10;
        const remainingTonnes = Math.round((remainingQ / 10) * 100) / 100;
        const lostTonnes = Math.round((lostQ / 10) * 100) / 100;
        const remainingRevenue = Math.round(remainingQ * Number(calcPricePerQuintal));
        const revenueDifference = Math.max(0, baselineGrossRevenue - remainingRevenue);

        return {
            lossPercent: pct,
            lostQ,
            remainingQ,
            remainingTonnes,
            lostTonnes,
            remainingRevenue,
            revenueDifference
        };
    }, [activeLossPercent, totalProductionQ, calcPricePerQuintal, baselineGrossRevenue]);

    // Available States for Filter Dropdown
    const availableStates = useMemo(() => {
        const states = Array.from(new Set(OFFLINE_MANDI_DATASET.map((r) => r.state)));
        return ["All", ...states.sort()];
    }, []);

    // Filtered Mandi Records
    const filteredMandiRecords = useMemo(() => {
        return OFFLINE_MANDI_DATASET.filter((row) => {
            if (selectedCropFilter !== "All" && row.commodity !== selectedCropFilter) return false;
            if (selectedStateFilter !== "All" && row.state !== selectedStateFilter) return false;
            if (marketSearchText.trim()) {
                const term = marketSearchText.toLowerCase();
                const inMarket = row.market.toLowerCase().includes(term);
                const inDistrict = row.district?.toLowerCase().includes(term);
                if (!inMarket && !inDistrict) return false;
            }
            return true;
        });
    }, [selectedCropFilter, selectedStateFilter, marketSearchText]);

    // Trend Chart Data for current selected crop in Mandi view
    const trendCommodity = selectedCropFilter !== "All" ? selectedCropFilter : calcCrop;
    const trendBasePrice = DEFAULT_CROP_PRICES[trendCommodity] || 2450;
    const trendData = useMemo(() => get7DayPriceTrend(trendBasePrice), [trendBasePrice]);

    // Use selected mandi price directly in calculator
    const handleSelectMandiForCalculator = (commodity, price) => {
        handleCropChange(commodity);
        setCalcPricePerQuintal(price);
        setActiveTab("calculator");
        toast.success(`Loaded ${commodity} @ ₹${price}/Q into Harvest Calculator`);
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
                                <RiFundsLine className="text-sm" />
                                <span>MARKET PRICES &amp; HARVEST SIMULATOR</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Harvest Calculator &amp; Mandi Intelligence
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Estimate gross production and revenue, simulate harvest loss scenarios, and review benchmark APMC mandi prices.
                            </p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm text-xs">
                            <button
                                type="button"
                                onClick={() => setActiveTab("calculator")}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "calculator"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Harvest Calculator
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("simulator")}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "simulator"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Harvest-Loss Simulator
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("mandi")}
                                className={`px-4 py-1.5 rounded-full font-bold transition ${
                                    activeTab === "mandi"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Mandi Prices &amp; Trends
                            </button>
                        </div>
                    </div>
                </div>

                {/* DEMO DATA STATUS NOTICE BANNER (NEVER SHOWN AS LIVE) */}
                <div className="mb-6 p-3.5 rounded-xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded font-extrabold tracking-wider bg-amber-200 text-amber-950 border border-amber-400 text-[11px]">
                            DEMO DATA
                        </span>
                        <span>
                            Illustrative prices, not current official mandi prices. Offline demonstration dataset across major Indian APMCs.
                        </span>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-900">
                        8 Crops Included • Offline Capable
                    </span>
                </div>

                {/* TAB 1: WORKING HARVEST CALCULATOR */}
                {activeTab === "calculator" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Inputs Card */}
                        <div className="lg:col-span-5 bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-2 pb-3 border-b border-[#A5A79B]/30 mb-5">
                                <RiCalculatorLine className="text-xl text-[#590907]" />
                                <h2 className="text-lg font-serif font-bold text-[#1C1E1B]">
                                    Harvest Production Inputs
                                </h2>
                            </div>

                            <form className="space-y-4 text-xs" onSubmit={(e) => e.preventDefault()}>
                                <div>
                                    <label className="block text-[#590907] font-bold mb-1 uppercase tracking-wider">
                                        Select Crop (8 Supported)
                                    </label>
                                    <select
                                        value={calcCrop}
                                        onChange={(e) => handleCropChange(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-bold text-[#590907] outline-none focus:border-[#590907]"
                                    >
                                        {SUPPORTED_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-bold mb-1">
                                        Farm Area in Acres
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        required
                                        value={calcArea}
                                        onChange={(e) => setCalcArea(Math.max(0.1, Number(e.target.value)))}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none focus:border-[#590907]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-bold mb-1">
                                        Expected Yield per Acre (Quintals / Acre)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="1"
                                        required
                                        value={calcYieldPerAcre}
                                        onChange={(e) => setCalcYieldPerAcre(Math.max(0.5, Number(e.target.value)))}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none focus:border-[#590907]"
                                    />
                                    <span className="text-[10px] text-[#A5A79B] mt-1 block">
                                        Typical baseline for {calcCrop}: ~{DEFAULT_YIELD_PRESETS[calcCrop] || 18} Q/Acre
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-bold mb-1">
                                        Selected Mandi Price per Quintal (₹ / Quintal)
                                    </label>
                                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7]">
                                        <FaRupeeSign className="text-xs text-[#590907]" />
                                        <input
                                            type="number"
                                            step="10"
                                            min="100"
                                            required
                                            value={calcPricePerQuintal}
                                            onChange={(e) => setCalcPricePerQuintal(Math.max(100, Number(e.target.value)))}
                                            className="w-full bg-transparent font-bold text-[#1C1E1B] outline-none"
                                        />
                                    </div>
                                    <span className="text-[10px] text-[#A5A79B] mt-1 block">
                                        Auto-filled from benchmark mandi modal price. Can be edited.
                                    </span>
                                </div>
                            </form>
                        </div>

                        {/* Calculation Results Card */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-7 shadow-sm">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                                    Harvest Output Calculations
                                </span>
                                <h3 className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                    {calcCrop} Production &amp; Gross Revenue
                                </h3>
                                <p className="text-xs text-[#545850] mt-0.5">
                                    Formula: <code>Area ({calcArea} Acres) × Yield ({calcYieldPerAcre} Q/Ac) = {totalProductionQ} Q</code>
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    {/* Total Production */}
                                    <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#A5A79B]/35 shadow-xs">
                                        <span className="text-xs font-bold text-[#545850] uppercase tracking-wider block mb-1">
                                            Total Estimated Production
                                        </span>
                                        <div className="my-1">
                                            <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                                {totalProductionQ.toLocaleString("en-IN")}
                                                <span className="text-base font-sans font-normal text-[#545850] ml-1.5">Quintals</span>
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8D2B5]/50 text-[#590907] mt-2">
                                            {totalProductionTonnes.toLocaleString("en-IN")} Metric Tonnes
                                        </div>
                                    </div>

                                    {/* Gross Revenue */}
                                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#590907]/10 to-[#E8D2B5]/30 border border-[#A5A79B]/40 shadow-xs">
                                        <span className="text-xs font-bold text-[#590907] uppercase tracking-wider block mb-1">
                                            Gross Revenue Projection
                                        </span>
                                        <div className="my-1">
                                            <span className="text-3xl font-serif font-bold text-[#590907]">
                                                ₹ {baselineGrossRevenue.toLocaleString("en-IN")}
                                            </span>
                                        </div>
                                        <span className="text-xs text-[#545850] block mt-2">
                                            Based on ₹{calcPricePerQuintal.toLocaleString("en-IN")}/Q market rate
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Action to Loss Simulator */}
                                <div className="mt-6 pt-5 border-t border-[#A5A79B]/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                                    <div className="text-[#545850]">
                                        Want to test disease impact or rainfall loss scenarios?
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("simulator")}
                                        className="px-4 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold flex items-center gap-1.5 hover:bg-[#420605] transition"
                                    >
                                        <span>Simulate Harvest Losses</span>
                                        <RiArrowRightUpLine />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: HARVEST-LOSS SIMULATOR */}
                {activeTab === "simulator" && (
                    <div className="space-y-6">
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#A5A79B]/30 mb-6">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                        Harvest-Loss Scenario Simulator
                                    </span>
                                    <h2 className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                        Hypothetical Loss &amp; Financial Impact
                                    </h2>
                                    <p className="text-xs text-[#545850] mt-1">
                                        Baseline: <strong>{totalProductionQ} Quintals</strong> ({totalProductionTonnes} Tonnes) valued at <strong>₹{baselineGrossRevenue.toLocaleString("en-IN")}</strong>.
                                    </p>
                                </div>

                                {/* Selectable Scenario Pills */}
                                <div className="flex flex-wrap items-center gap-2">
                                    {[0, 10, 20, 30].map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setSelectedLossPercent(pct)}
                                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
                                                selectedLossPercent === pct
                                                    ? "bg-[#590907] text-[#FDFBF7] border-[#590907] shadow-sm"
                                                    : "bg-[#FDFBF7] text-[#545850] border-[#A5A79B]/40 hover:border-[#590907]"
                                            }`}
                                        >
                                            {pct === 0 ? "0% (Baseline)" : `-${pct}% Loss`}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedLossPercent("custom")}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition border ${
                                            selectedLossPercent === "custom"
                                                ? "bg-[#590907] text-[#FDFBF7] border-[#590907] shadow-sm"
                                                : "bg-[#FDFBF7] text-[#545850] border-[#A5A79B]/40 hover:border-[#590907]"
                                        }`}
                                    >
                                        Custom %
                                    </button>
                                </div>
                            </div>

                            {/* Custom Percentage Input Slider if custom selected */}
                            {selectedLossPercent === "custom" && (
                                <div className="mb-6 p-4 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <span className="font-bold text-[#590907]">Custom Loss: {customLossInput}%</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="80"
                                            value={customLossInput}
                                            onChange={(e) => setCustomLossInput(Number(e.target.value))}
                                            className="w-48 accent-[#590907]"
                                        />
                                    </div>
                                    <span className="text-[#545850]">
                                        Adjust slider to simulate any custom disease severity scenario.
                                    </span>
                                </div>
                            )}

                            {/* 4 HIGHLIGHT CARDS FOR THE ACTIVE SCENARIO */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {/* 1. Remaining Harvest */}
                                <div className="p-5 rounded-2xl bg-white border border-[#A5A79B]/40 shadow-xs">
                                    <span className="text-xs font-bold text-[#545850] uppercase tracking-wider block mb-1">
                                        Remaining Harvest
                                    </span>
                                    <div className="my-1">
                                        <span className="text-2xl font-serif font-bold text-emerald-800">
                                            {activeScenarioDetails.remainingQ} <span className="text-xs font-sans font-semibold">Q</span>
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#545850] block mt-1">
                                        {activeScenarioDetails.remainingTonnes} Metric Tonnes
                                    </span>
                                </div>

                                {/* 2. Lost Production */}
                                <div className="p-5 rounded-2xl bg-white border border-[#A5A79B]/40 shadow-xs">
                                    <span className="text-xs font-bold text-[#545850] uppercase tracking-wider block mb-1">
                                        Lost Production
                                    </span>
                                    <div className="my-1">
                                        <span className="text-2xl font-serif font-bold text-rose-800">
                                            {activeScenarioDetails.lostQ} <span className="text-xs font-sans font-semibold">Q</span>
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#545850] block mt-1">
                                        {activeScenarioDetails.lostTonnes} Metric Tonnes ({activeScenarioDetails.lossPercent}%)
                                    </span>
                                </div>

                                {/* 3. Remaining Gross Revenue */}
                                <div className="p-5 rounded-2xl bg-white border border-[#A5A79B]/40 shadow-xs">
                                    <span className="text-xs font-bold text-[#545850] uppercase tracking-wider block mb-1">
                                        Remaining Gross Revenue
                                    </span>
                                    <div className="my-1">
                                        <span className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                            ₹ {activeScenarioDetails.remainingRevenue.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <span className="text-xs text-[#545850] block mt-1">
                                        From saleable crop
                                    </span>
                                </div>

                                {/* 4. Potential Revenue Difference */}
                                <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-300 shadow-xs">
                                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wider block mb-1">
                                        Revenue Difference
                                    </span>
                                    <div className="my-1">
                                        <span className="text-2xl font-serif font-bold text-rose-800">
                                            - ₹ {activeScenarioDetails.revenueDifference.toLocaleString("en-IN")}
                                        </span>
                                    </div>
                                    <span className="text-xs text-rose-700 block mt-1">
                                        Potential financial loss
                                    </span>
                                </div>
                            </div>

                            {/* SIDE-BY-SIDE CLEAR COMPARISON CHART */}
                            <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 mb-6">
                                <h3 className="font-serif font-bold text-base text-[#1C1E1B] mb-2 flex items-center gap-2">
                                    <RiBarChartBoxLine className="text-[#590907]" />
                                    <span>Side-by-Side Scenario Comparison</span>
                                </h3>
                                <p className="text-xs text-[#545850] mb-5">
                                    Compare remaining revenue (green) vs potential revenue loss (rose) across different damage percentages.
                                </p>

                                <div className="space-y-4 text-xs">
                                    {simulatedResults.map((sc) => {
                                        const remainingRatio = (sc.remainingRevenue / Math.max(1, baselineGrossRevenue)) * 100;
                                        const lossRatio = (sc.revenueDifference / Math.max(1, baselineGrossRevenue)) * 100;
                                        const isCurrent = sc.lossPercent === activeLossPercent;

                                        return (
                                            <div
                                                key={sc.lossPercent}
                                                className={`p-3.5 rounded-xl border transition ${
                                                    isCurrent
                                                        ? "bg-white border-[#590907] ring-2 ring-[#590907]/20 shadow-xs"
                                                        : "bg-white/70 border-[#A5A79B]/30"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-1.5 font-bold">
                                                    <span className="text-[#1C1E1B] flex items-center gap-2">
                                                        <span>{sc.label}</span>
                                                        {isCurrent && (
                                                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-[#590907] text-[#FDFBF7]">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-emerald-900 mr-3">₹ {sc.remainingRevenue.toLocaleString("en-IN")}</span>
                                                        {sc.revenueDifference > 0 && (
                                                            <span className="text-rose-700">- ₹ {sc.revenueDifference.toLocaleString("en-IN")}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Stacked comparison bar */}
                                                <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden flex">
                                                    <div
                                                        className="h-full bg-emerald-600 transition-all duration-300"
                                                        style={{ width: `${remainingRatio}%` }}
                                                        title={`Remaining Revenue: ₹${sc.remainingRevenue}`}
                                                    />
                                                    <div
                                                        className="h-full bg-rose-500 transition-all duration-300"
                                                        style={{ width: `${lossRatio}%` }}
                                                        title={`Revenue Loss: ₹${sc.revenueDifference}`}
                                                    />
                                                </div>

                                                <div className="flex justify-between text-[11px] text-[#545850] mt-1.5">
                                                    <span>Harvest: {sc.remainingQ} Q ({sc.remainingTonnes} T)</span>
                                                    <span>Lost: {sc.lostQ} Q ({sc.lostTonnes} T)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Explicit Disclaimer */}
                            <div className="p-4 rounded-xl bg-[#E8D2B5]/30 border border-[#A5A79B]/40 flex items-start gap-2.5 text-xs text-[#545850]">
                                <RiInformationLine className="text-base text-[#590907] shrink-0 mt-0.5" />
                                <p>
                                    <strong>Hypothetical Disclaimer:</strong> These are hypothetical financial scenarios for risk planning, not validated predictions of disease-related crop loss. Actual crop recovery depends on timing, weather, treatment response, and local field conditions.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: MANDI PRICES, COMPARISON TABLE & 7-DAY TREND */}
                {activeTab === "mandi" && (
                    <div className="space-y-6">
                        {/* Mandi Filters Card */}
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-[#A5A79B]/30 mb-5">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                        Illustrative APMC Mandi Rates
                                    </span>
                                    <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                        Benchmark Indian Mandi Prices (₹ / Quintal)
                                    </h2>
                                </div>
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    DEMO DATASET
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                                {/* 1. Commodity Dropdown */}
                                <div>
                                    <label className="block text-[#590907] font-bold mb-1 uppercase tracking-wider">
                                        Commodity Filter
                                    </label>
                                    <select
                                        value={selectedCropFilter}
                                        onChange={(e) => setSelectedCropFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-bold text-[#590907] outline-none"
                                    >
                                        <option value="All">All Commodities (8 Crops)</option>
                                        {SUPPORTED_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. State Filter */}
                                <div>
                                    <label className="block text-[#545850] font-bold mb-1">
                                        State Filter
                                    </label>
                                    <select
                                        value={selectedStateFilter}
                                        onChange={(e) => setSelectedStateFilter(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] font-semibold text-[#1C1E1B] outline-none"
                                    >
                                        {availableStates.map((st) => (
                                            <option key={st} value={st}>{st}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. Market Name Search */}
                                <div>
                                    <label className="block text-[#545850] font-bold mb-1">
                                        Mandi / APMC Name Search
                                    </label>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7]">
                                        <RiSearchLine className="text-[#A5A79B]" />
                                        <input
                                            type="text"
                                            placeholder="e.g. Pune, Lasalgaon, Agra..."
                                            value={marketSearchText}
                                            onChange={(e) => setMarketSearchText(e.target.value)}
                                            className="w-full bg-transparent outline-none text-[#1C1E1B]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SIMPLE 7-DAY PRICE TREND CHART */}
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#A5A79B]/20">
                                <div>
                                    <h3 className="font-serif font-bold text-base text-[#1C1E1B]">
                                        Recent 7-Day Modal Price Trend for {trendCommodity}
                                    </h3>
                                    <p className="text-xs text-[#545850]">
                                        Illustrative 7-day movement benchmark in ₹ per Quintal.
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-[#590907] px-2.5 py-1 rounded bg-[#E8D2B5]/30">
                                    Current: ₹{trendBasePrice}/Q
                                </span>
                            </div>

                            {/* SVG Trend Chart */}
                            <div className="w-full overflow-x-auto">
                                <div className="min-w-[500px] h-36 relative">
                                    <svg className="w-full h-full" viewBox="0 0 500 130" preserveAspectRatio="none">
                                        {/* Grid Line */}
                                        <line x1="30" y1="20" x2="480" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                                        <line x1="30" y1="65" x2="480" y2="65" stroke="#E5E7EB" strokeDasharray="3 3" />
                                        <line x1="30" y1="105" x2="480" y2="105" stroke="#E5E7EB" strokeDasharray="3 3" />

                                        {/* Trend Line */}
                                        <polyline
                                            fill="none"
                                            stroke="#590907"
                                            strokeWidth="2.5"
                                            points={trendData.map((pt, idx) => {
                                                const x = 40 + idx * 70;
                                                const diff = pt.price - trendBasePrice;
                                                const y = 65 - diff; // centered at 65
                                                return `${x},${y}`;
                                            }).join(" ")}
                                        />

                                        {/* Points and Labels */}
                                        {trendData.map((pt, idx) => {
                                            const x = 40 + idx * 70;
                                            const diff = pt.price - trendBasePrice;
                                            const y = 65 - diff;
                                            return (
                                                <g key={idx}>
                                                    <circle cx={x} cy={y} r="4" fill="#590907" />
                                                    <text x={x} y={y - 8} textAnchor="middle" className="text-[10px] fill-[#590907] font-bold">
                                                        ₹{pt.price}
                                                    </text>
                                                    <text x={x} y="122" textAnchor="middle" className="text-[10px] fill-[#6B7280]">
                                                        {pt.day}
                                                    </text>
                                                </g>
                                            );
                                        })}
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* PRICE COMPARISON TABLE */}
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-6 py-4 bg-[#FDFBF7] border-b border-[#A5A79B]/30 flex justify-between items-center">
                                <h3 className="font-serif font-bold text-base text-[#1C1E1B]">
                                    Price Comparison Table ({filteredMandiRecords.length} Markets)
                                </h3>
                                <span className="text-xs text-[#545850]">
                                    Click "Use in Calculator" to test farm revenue.
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-[#E8D2B5]/25 border-b border-[#A5A79B]/30 text-[#590907] font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-3 px-4">Watch</th>
                                            <th className="py-3 px-4">Commodity</th>
                                            <th className="py-3 px-4">Market / APMC</th>
                                            <th className="py-3 px-4">State</th>
                                            <th className="py-3 px-4 text-right">Min (₹/Q)</th>
                                            <th className="py-3 px-4 text-right">Modal (₹/Q)</th>
                                            <th className="py-3 px-4 text-right">Max (₹/Q)</th>
                                            <th className="py-3 px-4">Sample Date</th>
                                            <th className="py-3 px-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#A5A79B]/20">
                                        {filteredMandiRecords.map((row, idx) => {
                                            const watchKey = `${row.market}-${row.commodity}`;
                                            const isSaved = watchlist.includes(watchKey);

                                            return (
                                                <tr key={`${row.market}-${row.commodity}-${idx}`} className="hover:bg-[#FDFBF7] transition">
                                                    <td className="py-3 px-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleWatchlist(watchKey)}
                                                            className="text-base text-[#590907] hover:scale-110 transition"
                                                            title={isSaved ? "Remove from Watchlist" : "Save to Watchlist"}
                                                        >
                                                            {isSaved ? <RiBookmarkFill /> : <RiBookmarkLine />}
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-4 font-bold text-[#590907]">
                                                        {row.commodity}
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-[#1C1E1B]">
                                                        {row.market}
                                                    </td>
                                                    <td className="py-3 px-4 text-[#545850]">
                                                        {row.state}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-[#545850]">
                                                        ₹ {row.min_price.toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-bold text-base text-[#1C1E1B]">
                                                        ₹ {row.modal_price.toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="py-3 px-4 text-right text-[#545850]">
                                                        ₹ {row.max_price.toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="py-3 px-4 text-[#545850]">
                                                        {row.date}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectMandiForCalculator(row.commodity, row.modal_price)}
                                                            className="px-3 py-1 rounded-lg bg-[#590907] text-[#FDFBF7] font-semibold text-[11px] hover:bg-[#420605] transition shadow-xs"
                                                        >
                                                            Use in Calculator
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
