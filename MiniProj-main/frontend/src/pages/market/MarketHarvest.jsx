import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import {
    RiBarChartLine,
    RiFundsLine,
    RiBookmarkLine,
    RiBookmarkFill,
    RiSearchLine,
    RiInformationLine,
    RiCheckLine,
    RiArrowRightUpLine
} from "react-icons/ri";
import { FaBalanceScale, FaRupeeSign, FaCalendarAlt, FaWarehouse } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const INDIAN_CROPS = [
    "Wheat", "Rice", "Potato", "Maize", "Cotton", "Sugarcane", "Mustard",
    "Soybean", "Groundnut", "Tomato", "Onion", "Pulses", "Barley"
];

const SEASONS = ["Rabi", "Kharif", "Whole Year", "Summer (Zaid)"];

export default function MarketHarvest() {
    const { authUser } = useAuthContext();
    const { farmProfile, activePlot } = useFarmContext();

    const [activeTab, setActiveTab] = useState("yield"); // 'yield', 'simulator', 'mandi'

    // Yield Prediction Form State
    const [yieldForm, setYieldForm] = useState({
        crop: activePlot?.crop || "Wheat",
        state: farmProfile?.state || "Maharashtra",
        district: farmProfile?.district || "Pune",
        season: "Rabi",
        area: activePlot?.area || 2.5,
        areaUnit: activePlot?.areaUnit || "Acres",
        soilType: activePlot?.soilType || "Loamy",
        annualRainfall: 950
    });

    const [yieldResult, setYieldResult] = useState(null);
    const [isCalculatingYield, setIsCalculatingYield] = useState(false);

    // Simulator State
    const [simulatorPrice, setSimulatorPrice] = useState(2275);
    const [simulatorResult, setSimulatorResult] = useState(null);
    const [isSimulating, setIsSimulating] = useState(false);

    // Mandi Price State
    const [mandiFilterCrop, setMandiFilterCrop] = useState(activePlot?.crop || "Wheat");
    const [mandiFilterState, setMandiFilterState] = useState("");
    const [mandiFilterMarket, setMandiFilterMarket] = useState("");
    const [mandiData, setMandiData] = useState([]);
    const [mandiFreshness, setMandiFreshness] = useState("CACHED");
    const [mandiSource, setMandiSource] = useState("");
    const [isLoadingMandi, setIsLoadingMandi] = useState(false);
    const [watchlist, setWatchlist] = useState([]);

    // Sync from active plot if available
    useEffect(() => {
        if (activePlot) {
            setYieldForm(prev => ({
                ...prev,
                crop: activePlot.crop || prev.crop,
                area: activePlot.area || prev.area,
                areaUnit: activePlot.areaUnit || prev.areaUnit,
                soilType: activePlot.soilType || prev.soilType
            }));
            setMandiFilterCrop(activePlot.crop || "Wheat");
        }
    }, [activePlot]);

    const handleRunYieldPrediction = async (e) => {
        if (e) e.preventDefault();
        setIsCalculatingYield(true);
        try {
            const res = await fetch(`${API_BASE}/intelligence/yield-prediction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(yieldForm)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setYieldResult(data);
                // Also trigger harvest simulator baseline
                runSimulator(data.yieldPerAcre.quintals, data.area);
            } else {
                toast.error(data.error || "Failed to calculate yield");
            }
        } catch {
            toast.error("Network error calculating yield");
        } finally {
            setIsCalculatingYield(false);
        }
    };

    const runSimulator = async (yieldQ, area) => {
        setIsSimulating(true);
        try {
            const res = await fetch(`${API_BASE}/intelligence/harvest-simulator`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    crop: yieldForm.crop,
                    area: area || yieldForm.area,
                    areaUnit: yieldForm.areaUnit,
                    baselineYieldPerAcreQ: yieldQ,
                    mandiPricePerQuintal: simulatorPrice
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setSimulatorResult(data);
            }
        } catch (err) {
            console.warn("Simulator error:", err);
        } finally {
            setIsSimulating(false);
        }
    };

    const fetchMandiPrices = useCallback(async () => {
        setIsLoadingMandi(true);
        try {
            const params = new URLSearchParams();
            if (mandiFilterCrop) params.append("crop", mandiFilterCrop);
            if (mandiFilterState) params.append("state", mandiFilterState);
            if (mandiFilterMarket) params.append("market", mandiFilterMarket);

            const res = await fetch(`${API_BASE}/mandi/prices?${params.toString()}`);
            const data = await res.json();
            if (res.ok && data.records) {
                setMandiData(data.records);
                setMandiFreshness(data.freshness || "CACHED");
                setMandiSource(data.sourceAttribution || "Agmarknet Benchmark");

                // Update simulator default price from modal price if matched
                if (data.records.length > 0 && data.records[0].modal_price > 0) {
                    setSimulatorPrice(data.records[0].modal_price);
                }
            }
        } catch (err) {
            console.warn("Mandi price fetch error:", err);
        } finally {
            setIsLoadingMandi(false);
        }
    }, [mandiFilterCrop, mandiFilterState, mandiFilterMarket]);

    const fetchWatchlist = useCallback(async () => {
        if (!authUser) return;
        try {
            const token = authUser.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/mandi/watchlist`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const data = await res.json();
            if (res.ok && data.watchlist) {
                setWatchlist(data.watchlist);
            }
        } catch (err) {
            console.warn("Watchlist fetch error:", err);
        }
    }, [authUser]);

    const toggleWatchlist = async (crop, market, state) => {
        if (!authUser) {
            toast.error("Please login to save crops to your watchlist");
            return;
        }
        try {
            const token = authUser.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/mandi/watchlist/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ crop, market, state })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                fetchWatchlist();
            }
        } catch {
            toast.error("Error updating watchlist");
        }
    };

    useEffect(() => {
        handleRunYieldPrediction();
        fetchMandiPrices();
        fetchWatchlist();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#590907]/10 via-[#E8D2B5]/30 to-[#A5A79B]/20 border border-[#A5A79B]/40 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-semibold mb-2">
                                <RiFundsLine className="text-sm" />
                                <span>Yield &amp; Market Intelligence</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Harvest Production &amp; Mandi Prices
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Estimate expected harvest production, simulate financial loss scenarios, and track real-time Indian mandi prices.
                            </p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveTab("yield")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "yield"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Yield Estimator
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("simulator")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "simulator"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Harvest Simulator
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("mandi")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "mandi"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Mandi Prices
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAB 1: YIELD PREDICTION */}
                {activeTab === "yield" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form Column */}
                        <div className="lg:col-span-5 bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-serif font-bold text-[#1C1E1B] mb-1">
                                Field &amp; Crop Parameters
                            </h2>
                            <p className="text-xs text-[#545850] mb-5">
                                Automatically loaded from your active field plot ({activePlot?.name || "Main Field"}).
                            </p>

                            <form onSubmit={handleRunYieldPrediction} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Crop</label>
                                    <select
                                        value={yieldForm.crop}
                                        onChange={(e) => setYieldForm({ ...yieldForm, crop: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                    >
                                        {INDIAN_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Cultivated Area</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            required
                                            value={yieldForm.area}
                                            onChange={(e) => setYieldForm({ ...yieldForm, area: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Unit</label>
                                        <select
                                            value={yieldForm.areaUnit}
                                            onChange={(e) => setYieldForm({ ...yieldForm, areaUnit: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                        >
                                            <option value="Acres">Acres</option>
                                            <option value="Hectares">Hectares</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">State</label>
                                        <input
                                            type="text"
                                            value={yieldForm.state}
                                            onChange={(e) => setYieldForm({ ...yieldForm, state: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Season</label>
                                        <select
                                            value={yieldForm.season}
                                            onChange={(e) => setYieldForm({ ...yieldForm, season: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                        >
                                            {SEASONS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Soil Type</label>
                                        <select
                                            value={yieldForm.soilType}
                                            onChange={(e) => setYieldForm({ ...yieldForm, soilType: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                        >
                                            <option value="Loamy">Loamy Soil</option>
                                            <option value="Clayey">Clayey Soil</option>
                                            <option value="Black">Black Soil (Regur)</option>
                                            <option value="Red">Red Soil</option>
                                            <option value="Sandy">Sandy Loam</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Annual Rain (mm)</label>
                                        <input
                                            type="number"
                                            value={yieldForm.annualRainfall}
                                            onChange={(e) => setYieldForm({ ...yieldForm, annualRainfall: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                            placeholder="e.g. 950"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCalculatingYield}
                                    className="w-full py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition disabled:opacity-50 mt-2"
                                >
                                    {isCalculatingYield ? "Estimating Yield..." : "Calculate Expected Yield"}
                                </button>
                            </form>
                        </div>

                        {/* Result Column */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            {yieldResult ? (
                                <>
                                    <div className="bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                                            Yield Estimation Result
                                        </span>
                                        <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1E1B]">
                                            {yieldResult.crop} Production Projection
                                        </h3>
                                        <p className="text-xs text-[#545850] mt-0.5">
                                            For {yieldResult.area} {yieldResult.areaUnit} in {yieldResult.district}, {yieldResult.state}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                            <div className="bg-white p-4 rounded-xl border border-[#A5A79B]/30 shadow-xs">
                                                <span className="text-xs text-[#545850] block font-medium">Estimated Total Production</span>
                                                <span className="text-2xl font-serif font-bold text-[#590907]">
                                                    {yieldResult.totalEstimatedProduction.quintals} <span className="text-sm font-sans font-semibold">Q</span>
                                                </span>
                                                <span className="text-xs text-[#545850] block mt-0.5">
                                                    ({yieldResult.totalEstimatedProduction.tonnes} Tonnes)
                                                </span>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-[#A5A79B]/30 shadow-xs">
                                                <span className="text-xs text-[#545850] block font-medium">Yield per Acre</span>
                                                <span className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                                    {yieldResult.yieldPerAcre.quintals} <span className="text-sm font-sans font-semibold">Q/Acre</span>
                                                </span>
                                                <span className="text-xs text-[#545850] block mt-0.5">
                                                    ≈ {yieldResult.yieldPerAcre.kg} kg/acre
                                                </span>
                                            </div>

                                            <div className="bg-white p-4 rounded-xl border border-[#A5A79B]/30 shadow-xs">
                                                <span className="text-xs text-[#545850] block font-medium">Yield per Hectare</span>
                                                <span className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                                    {yieldResult.yieldPerHectare.tonnes} <span className="text-sm font-sans font-semibold">T/Ha</span>
                                                </span>
                                                <span className="text-xs text-[#545850] block mt-0.5">
                                                    Standard Metric
                                                </span>
                                            </div>
                                        </div>

                                        {/* Confidence Band */}
                                        <div className="mt-5 p-4 rounded-xl bg-[#E8D2B5]/25 border border-[#A5A79B]/30 text-xs">
                                            <div className="flex items-center gap-2 font-bold text-[#590907] mb-1">
                                                <FaBalanceScale className="text-sm" />
                                                <span>Confidence Band &amp; Agronomic Range</span>
                                            </div>
                                            <p className="text-[#1C1E1B]">
                                                Under typical weather, expected production ranges from{" "}
                                                <strong>{yieldResult.confidenceRange.minQuintals} Q</strong> to{" "}
                                                <strong>{yieldResult.confidenceRange.maxQuintals} Q</strong> ({yieldResult.confidenceRange.confidenceLevel}).
                                            </p>
                                            <p className="text-[#545850] mt-1 text-[11px]">
                                                {yieldResult.modelMetadata.assumptionsNote}
                                            </p>
                                        </div>

                                        <div className="mt-5 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab("simulator")}
                                                className="px-4 py-2 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold hover:bg-[#420605] flex items-center gap-1.5 transition"
                                            >
                                                <span>Run Financial Loss Simulator</span>
                                                <RiArrowRightUpLine />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-8 text-center text-[#545850]">
                                    <p>Select your field parameters and click "Calculate Expected Yield" to see production estimates.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 2: HARVEST & FINANCIAL LOSS SIMULATOR */}
                {activeTab === "simulator" && (
                    <div className="space-y-6">
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#A5A79B]/30 mb-6">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                        Harvest-Impact Simulator
                                    </span>
                                    <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                        Hypothetical Loss &amp; Financial Exposure
                                    </h2>
                                    <p className="text-xs text-[#545850] mt-0.5">
                                        Compare your ideal harvest earnings against hypothetical disease or weather loss scenarios.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-xs">
                                        <label className="block text-[#545850] font-semibold mb-0.5">Mandi Price (₹/Quintal)</label>
                                        <div className="flex items-center gap-1 bg-[#FDFBF7] px-3 py-1.5 rounded-xl border border-[#A5A79B]/40">
                                            <FaRupeeSign className="text-xs text-[#590907]" />
                                            <input
                                                type="number"
                                                value={simulatorPrice}
                                                onChange={(e) => setSimulatorPrice(Number(e.target.value))}
                                                className="w-24 bg-transparent font-bold text-[#1C1E1B] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => runSimulator(yieldResult?.yieldPerAcre.quintals || 20, yieldForm.area)}
                                        className="px-4 py-2 mt-4 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold shadow hover:bg-[#420605] transition"
                                    >
                                        Update Scenarios
                                    </button>
                                </div>
                            </div>

                            {/* Scenarios Table */}
                            {simulatorResult ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {simulatorResult.scenarios.map((sc, idx) => (
                                            <div
                                                key={sc.scenarioName}
                                                className={`rounded-2xl p-5 border flex flex-col justify-between ${
                                                    idx === 0
                                                        ? "bg-emerald-50/50 border-emerald-300"
                                                        : idx === 1
                                                        ? "bg-amber-50/40 border-amber-300"
                                                        : "bg-rose-50/40 border-rose-300"
                                                }`}
                                            >
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs font-bold text-[#1C1E1B]">{sc.scenarioName}</span>
                                                        <span
                                                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                                                sc.lossPercent === 0
                                                                    ? "bg-emerald-200 text-emerald-900"
                                                                    : "bg-rose-200 text-rose-900"
                                                            }`}
                                                        >
                                                            {sc.lossPercent === 0 ? "0% Loss" : `-${sc.lossPercent}% Loss`}
                                                        </span>
                                                    </div>

                                                    <p className="text-[11px] text-[#545850] min-h-[36px] mb-4">
                                                        {sc.description}
                                                    </p>

                                                    <div className="space-y-1.5 py-3 border-t border-black/10 text-xs">
                                                        <div className="flex justify-between">
                                                            <span className="text-[#545850]">Expected Harvest:</span>
                                                            <span className="font-bold text-[#1C1E1B]">{sc.productionQ} Q</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-[#545850]">Est. Gross Revenue:</span>
                                                            <span className="font-bold text-[#590907]">₹ {sc.grossRevenue.toLocaleString("en-IN")}</span>
                                                        </div>
                                                        {sc.revenueExposure > 0 && (
                                                            <div className="flex justify-between text-rose-700">
                                                                <span>Financial Exposure:</span>
                                                                <span className="font-bold">- ₹ {sc.revenueExposure.toLocaleString("en-IN")}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Agronomic Disclaimer */}
                                    <div className="p-4 rounded-xl bg-[#E8D2B5]/20 border border-[#A5A79B]/30 flex items-start gap-2.5 text-xs text-[#545850]">
                                        <RiInformationLine className="text-base text-[#590907] shrink-0 mt-0.5" />
                                        <p>
                                            <strong>Visible Assumptions Notice:</strong> {simulatorResult.disclaimer} Gross revenue estimates represent total crop sales value and do not deduct input costs (diesel, electricity, seeds, labor, or fertilizers).
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-[#545850] text-center py-6">
                                    Click "Update Scenarios" to run the harvest-impact calculations.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: MANDI PRICES TRACKER */}
                {activeTab === "mandi" && (
                    <div className="space-y-6">
                        {/* Mandi Filters & Search */}
                        <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                        Mandi Prices &amp; Market Intelligence
                                    </span>
                                    <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                        Agmarknet APMC Market Rates
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            mandiFreshness === "LIVE"
                                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                                : "bg-blue-100 text-blue-800 border border-blue-300"
                                        }`}>
                                            {mandiFreshness === "LIVE" ? "● LIVE DATA" : "● VERIFIED BENCHMARK CACHE"}
                                        </span>
                                        <span className="text-xs text-[#545850]">• Source: {mandiSource}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-4">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Crop / Commodity</label>
                                    <select
                                        value={mandiFilterCrop}
                                        onChange={(e) => setMandiFilterCrop(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                    >
                                        <option value="">All Commodities</option>
                                        {INDIAN_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">State</label>
                                    <input
                                        type="text"
                                        value={mandiFilterState}
                                        onChange={(e) => setMandiFilterState(e.target.value)}
                                        placeholder="e.g. Maharashtra, Punjab"
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Mandi / Market Name</label>
                                    <input
                                        type="text"
                                        value={mandiFilterMarket}
                                        onChange={(e) => setMandiFilterMarket(e.target.value)}
                                        placeholder="e.g. Pune, Lasalgaon"
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] focus:outline-none focus:border-[#590907]"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={fetchMandiPrices}
                                    className="px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold shadow hover:bg-[#420605] flex items-center gap-1.5 transition"
                                >
                                    <RiSearchLine />
                                    <span>Search Mandis</span>
                                </button>
                            </div>
                        </div>

                        {/* Mandi Cards Grid */}
                        {isLoadingMandi ? (
                            <div className="p-8 text-center text-xs text-[#545850]">Loading latest mandi records...</div>
                        ) : mandiData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {mandiData.map((item, idx) => {
                                    const isSaved = watchlist.some(w => w.crop === item.commodity && w.market === item.market);
                                    return (
                                        <div
                                            key={`${item.market}-${item.commodity}-${idx}`}
                                            className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-xs hover:border-[#590907]/40 transition flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-xs font-bold text-[#590907] uppercase tracking-wider block">
                                                            {item.commodity}
                                                        </span>
                                                        <h3 className="font-bold text-base text-[#1C1E1B]">
                                                            {item.market}
                                                        </h3>
                                                        <span className="text-xs text-[#545850]">
                                                            {item.district ? `${item.district}, ` : ""}{item.state}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => toggleWatchlist(item.commodity, item.market, item.state)}
                                                        className="text-lg text-[#590907] p-1.5 rounded-full hover:bg-[#E8D2B5]/30 transition"
                                                        title={isSaved ? "Remove from watchlist" : "Add to watchlist"}
                                                    >
                                                        {isSaved ? <RiBookmarkFill /> : <RiBookmarkLine />}
                                                    </button>
                                                </div>

                                                {/* Price highlight */}
                                                <div className="my-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                                                    <span className="text-[11px] text-[#545850] block font-medium">Modal Price (Prevailing Rate)</span>
                                                    <span className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                                        ₹ {item.modal_price.toLocaleString("en-IN")}
                                                        <span className="text-xs font-sans text-[#545850] font-normal ml-1">/ Quintal</span>
                                                    </span>

                                                    <div className="flex justify-between text-xs text-[#545850] mt-2 pt-2 border-t border-[#A5A79B]/20">
                                                        <span>Min: ₹ {item.min_price}</span>
                                                        <span>Max: ₹ {item.max_price}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-[#A5A79B]/20 flex justify-between items-center text-[11px] text-[#545850]">
                                                <span>Arrival: {item.arrival_date}</span>
                                                <span className="font-medium text-[#590907]">{item.variety}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-[#545850] bg-white rounded-2xl border border-[#A5A79B]/40">
                                No mandi records found matching the current search filters. Try selecting another crop or clearing the state filter.
                            </div>
                        )}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
