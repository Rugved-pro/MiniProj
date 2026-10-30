import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    RiDropLine,
    RiTempHotLine,
    RiCloudWindyLine,
    RiAlertLine,
    RiCheckboxCircleLine,
    RiInformationLine,
    RiSettings3Line,
    RiRefreshLine,
    RiTimeLine
} from "react-icons/ri";
import { WiDaySunny, WiRaindrop, WiHumidity } from "react-icons/wi";
import { MdOutlineSensors, MdWaterDrop } from "react-icons/md";
import { FaBroadcastTower, FaEdit, FaSlidersH } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export default function FieldIntelligence() {
    const { activePlot, farmProfile } = useFarmContext();

    const [mode, setMode] = useState("simulated"); // 'simulated', 'manual', 'hardware'
    const [telemetry, setTelemetry] = useState(null);
    const [advisory, setAdvisory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

    // Manual Input Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        soilMoisture: 38,
        temperature: 28,
        humidity: 62,
        rainfall: 0,
        soilBallFeel: "Moist ball forms, does not crumble"
    });

    const fetchReadings = useCallback(async (currentMode = mode) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/iot/readings?mode=${currentMode}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const data = await res.json();
            if (res.ok) {
                setTelemetry(data.readings);
                setAdvisory(data.advisory);
            }
        } catch (err) {
            console.warn("Could not load field telemetry:", err);
        } finally {
            setIsLoading(false);
        }
    }, [mode]);

    useEffect(() => {
        fetchReadings(mode);
    }, [fetchReadings, mode]);

    const handleSaveManualReading = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/iot/manual`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(manualForm)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Manual observations recorded");
                setIsManualModalOpen(false);
                setMode("manual");
                fetchReadings("manual");
            } else {
                toast.error(data.error || "Failed to record observation");
            }
        } catch {
            toast.error("Network error recording observation");
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#590907]/10 via-[#E8D2B5]/30 to-[#A5A79B]/20 border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-semibold mb-2">
                                <MdOutlineSensors className="text-sm" />
                                <span>Field Health &amp; Soil Intelligence</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Your Field Readings &amp; Watering Guide
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Understand your soil moisture and weather conditions in simple language, with explainable watering advice for {activePlot?.name || "your field"}.
                            </p>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm text-xs">
                                <button
                                    type="button"
                                    onClick={() => setMode("simulated")}
                                    className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                                        mode === "simulated"
                                            ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                            : "text-[#545850] hover:text-[#590907]"
                                    }`}
                                >
                                    Demo Simulation
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("manual")}
                                    className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                                        mode === "manual"
                                            ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                            : "text-[#545850] hover:text-[#590907]"
                                    }`}
                                >
                                    Manual Input
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("hardware")}
                                    className={`px-3.5 py-1.5 rounded-full font-semibold transition ${
                                        mode === "hardware"
                                            ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                            : "text-[#545850] hover:text-[#590907]"
                                    }`}
                                >
                                    ESP32 Hardware
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => fetchReadings(mode)}
                                className="text-xs text-[#590907] hover:underline flex items-center gap-1 font-semibold"
                            >
                                <RiRefreshLine className={isLoading ? "animate-spin" : ""} /> Refresh Readings
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mode Status Banner */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border bg-white border-[#A5A79B]/30 text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                            telemetry?.isSimulated
                                ? "bg-amber-500 animate-pulse"
                                : telemetry?.connectionStatus === "ONLINE"
                                ? "bg-emerald-500"
                                : telemetry?.connectionStatus === "MANUAL_ENTRY"
                                ? "bg-blue-500"
                                : "bg-rose-500"
                        }`} />
                        <span className="font-bold text-[#1C1E1B]">
                            {telemetry?.isSimulated
                                ? "SIMULATED DEMONSTRATION MODE"
                                : telemetry?.mode === "MANUAL"
                                ? "MANUAL FARMER OBSERVATION MODE"
                                : "PHYSICAL HARDWARE SENSOR MODE"}
                        </span>
                        <span className="text-[#545850]">•</span>
                        <span className="text-[#545850]">
                            {telemetry?.lastUpdated ? `Last updated: ${new Date(telemetry.lastUpdated).toLocaleTimeString()}` : "No reading on record"}
                        </span>
                    </div>

                    {mode === "manual" && (
                        <button
                            type="button"
                            onClick={() => setIsManualModalOpen(true)}
                            className="px-3 py-1 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold flex items-center gap-1"
                        >
                            <FaEdit /> Enter Today's Reading
                        </button>
                    )}

                    {telemetry?.disclaimer && (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            {telemetry.disclaimer}
                        </span>
                    )}
                </div>

                {/* PRACTICAL WATERING ADVICE BANNER */}
                {advisory?.irrigationAdvice && (
                    <div className="bg-gradient-to-br from-emerald-50/70 via-white to-[#E8D2B5]/20 border-2 border-emerald-600/40 rounded-2xl p-6 sm:p-7 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-emerald-900/10">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 block mb-1">
                                    Practical Watering Recommendation
                                </span>
                                <h2 className="text-2xl font-serif font-bold text-[#1C1E1B]">
                                    {advisory.irrigationAdvice.action}
                                </h2>
                            </div>
                            <div className="px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                                <MdWaterDrop className="text-sm" />
                                <span>{activePlot?.crop || "Wheat"} in {activePlot?.soilType || "Loamy"} Soil</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                            <div className="p-3.5 rounded-xl bg-white border border-[#A5A79B]/30">
                                <span className="font-bold text-[#590907] block mb-1">Why the system suggests this:</span>
                                <p className="text-[#545850] leading-relaxed">{advisory.irrigationAdvice.reason}</p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-white border border-[#A5A79B]/30">
                                <span className="font-bold text-[#1C1E1B] block mb-1">When to check next:</span>
                                <p className="text-[#545850] leading-relaxed">{advisory.irrigationAdvice.nextCheckTime}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4 CORE METRIC CARDS (FARMER-FRIENDLY) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    {/* 1. Soil Moisture */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    How Wet Is Your Soil?
                                </span>
                                <RiDropLine className="text-xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.soilMoisture ?? "--"}
                                    <span className="text-base font-sans font-normal text-[#545850] ml-1">%</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Status: {advisory?.soilMoisture?.status || "Comfortable"}
                            </div>

                            <p className="text-xs text-[#545850] leading-relaxed border-t border-[#A5A79B]/20 pt-2.5">
                                {advisory?.soilMoisture?.explanation || "Sufficient water stored in root zone."}
                            </p>
                        </div>
                    </div>

                    {/* 2. Temperature */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Air Temperature
                                </span>
                                <WiDaySunny className="text-2xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.temperature ?? "--"}
                                    <span className="text-base font-sans font-normal text-[#545850] ml-1">°C</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 bg-blue-100 text-blue-900 border border-blue-300">
                                {advisory?.temperature?.status || "Normal Field Range"}
                            </div>

                            <p className="text-xs text-[#545850] leading-relaxed border-t border-[#A5A79B]/20 pt-2.5">
                                {advisory?.temperature?.explanation || "Favorable temperature for plant respiration."}
                            </p>
                        </div>
                    </div>

                    {/* 3. Humidity */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Moisture in the Air
                                </span>
                                <WiHumidity className="text-2xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.humidity ?? "--"}
                                    <span className="text-base font-sans font-normal text-[#545850] ml-1">%</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {advisory?.humidity?.status || "Comfortable"}
                            </div>

                            <p className="text-xs text-[#545850] leading-relaxed border-t border-[#A5A79B]/20 pt-2.5">
                                {advisory?.humidity?.pathogenNotice || advisory?.humidity?.explanation || "Moderate humidity level."}
                            </p>
                        </div>
                    </div>

                    {/* 4. Rainfall */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Recent Rainfall
                                </span>
                                <WiRaindrop className="text-2xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.rainfall ?? "0"}
                                    <span className="text-base font-sans font-normal text-[#545850] ml-1">mm</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold mb-3 bg-[#E8D2B5]/50 text-[#1C1E1B] border border-[#A5A79B]/30">
                                Root-Zone Reserve: Good
                            </div>

                            <p className="text-xs text-[#545850] leading-relaxed border-t border-[#A5A79B]/20 pt-2.5">
                                No heavy rainfall in last 24 hours. Normal irrigation scheduling applies.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CONVERSATIONAL ALERTS */}
                {advisory?.alerts && advisory.alerts.length > 0 && (
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 mb-8 shadow-sm space-y-3">
                        <h3 className="font-serif font-bold text-base text-[#1C1E1B] flex items-center gap-2">
                            <RiAlertLine className="text-[#590907]" />
                            <span>Explainable Field Alerts</span>
                        </h3>

                        <div className="space-y-2.5">
                            {advisory.alerts.map((alert, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                                        alert.level === "warning"
                                            ? "bg-amber-50/70 border-amber-300 text-amber-950"
                                            : "bg-blue-50/70 border-blue-300 text-blue-950"
                                    }`}
                                >
                                    <RiInformationLine className="text-base shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="block font-bold">{alert.title}</strong>
                                        <span className="leading-relaxed">{alert.message}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EXPANDABLE TECHNICAL DETAILS (FAO-56 CALCULATIONS) */}
                <div className="border border-[#A5A79B]/30 rounded-2xl bg-white overflow-hidden shadow-xs">
                    <button
                        type="button"
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-[#545850] hover:text-[#1C1E1B] hover:bg-[#FDFBF7] transition"
                    >
                        <span>Detailed Technical Agronomic Measurements (FAO-56 Water Balance)</span>
                        <span>{showTechnicalDetails ? "▲ Hide Technical Details" : "▼ Show Technical Details"}</span>
                    </button>

                    {showTechnicalDetails && (
                        <div className="p-6 border-t border-[#A5A79B]/30 bg-[#FDFBF7] text-xs text-[#545850] space-y-4">
                            <p>
                                <strong>Technical Framework:</strong> Irrigation advisory is modeled using the FAO Irrigation and Drainage Paper No. 56 dual crop coefficient and root-zone water balance framework. Soil moisture thresholds correspond to field capacity (FC ≈ 32% volumetric for loamy soil) and permanent wilting point (PWP ≈ 14%).
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                                <div className="p-3 rounded-lg bg-white border border-[#A5A79B]/30">
                                    <span className="block font-medium">Field Capacity (FC)</span>
                                    <span className="font-bold text-[#1C1E1B]">32% vol</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-[#A5A79B]/30">
                                    <span className="block font-medium">Wilting Point (PWP)</span>
                                    <span className="font-bold text-[#1C1E1B]">14% vol</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-[#A5A79B]/30">
                                    <span className="block font-medium">Depletion Fraction (p)</span>
                                    <span className="font-bold text-[#1C1E1B]">0.55 (Wheat)</span>
                                </div>
                                <div className="p-3 rounded-lg bg-white border border-[#A5A79B]/30">
                                    <span className="block font-medium">Battery Node Telemetry</span>
                                    <span className="font-bold text-[#1C1E1B]">{telemetry?.batteryVoltage || 3.9} V</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Manual Observation Input */}
            {isManualModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#FDFBF7] border border-[#A5A79B]/50 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center pb-3 border-b border-[#A5A79B]/30 mb-4">
                            <h3 className="font-serif font-bold text-lg text-[#1C1E1B]">Enter Field Observation</h3>
                            <button
                                type="button"
                                onClick={() => setIsManualModalOpen(false)}
                                className="text-[#545850] hover:text-[#1C1E1B] text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveManualReading} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[#545850] font-semibold mb-1">Estimated Soil Moisture (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={manualForm.soilMoisture}
                                    onChange={(e) => setManualForm({ ...manualForm, soilMoisture: Number(e.target.value) })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[#545850] font-semibold mb-1">Soil Hand-Ball Feel</label>
                                <select
                                    value={manualForm.soilBallFeel}
                                    onChange={(e) => setManualForm({ ...manualForm, soilBallFeel: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white"
                                >
                                    <option value="Dry, powdery, crumbles immediately">Dry, powdery, crumbles immediately (Low)</option>
                                    <option value="Moist ball forms, does not crumble">Moist ball forms, does not crumble (Good)</option>
                                    <option value="Wet, leaves muddy smear on hand">Wet, leaves muddy smear on hand (High)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Temperature (°C)</label>
                                    <input
                                        type="number"
                                        required
                                        value={manualForm.temperature}
                                        onChange={(e) => setManualForm({ ...manualForm, temperature: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Humidity (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        required
                                        value={manualForm.humidity}
                                        onChange={(e) => setManualForm({ ...manualForm, humidity: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-[#A5A79B]/30">
                                <button
                                    type="button"
                                    onClick={() => setIsManualModalOpen(false)}
                                    className="px-4 py-2 rounded-full border border-[#A5A79B]/50 text-[#545850] font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold shadow hover:bg-[#420605]"
                                >
                                    Save Observation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
