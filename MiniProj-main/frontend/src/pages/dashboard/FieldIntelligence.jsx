import { useState, useEffect, useCallback, useRef } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    RiDropLine,
    RiAlertLine,
    RiCheckboxCircleLine,
    RiInformationLine,
    RiRefreshLine,
    RiTimeLine,
    RiPlayCircleLine,
    RiPauseCircleLine,
    RiSunLine,
    RiBattery2ChargeLine
} from "react-icons/ri";
import { WiDaySunny, WiRaindrop, WiHumidity } from "react-icons/wi";
import { MdOutlineSensors, MdWaterDrop } from "react-icons/md";
import { FaEdit, FaSlidersH, FaHistory, FaCheck } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

// Demo Scenarios with precise initial values & 3-part farmer-friendly explanations
const SCENARIOS = {
    high_humidity: {
        key: "high_humidity",
        name: "High Humidity (Fungal Risk)",
        badge: "Fungal Risk Alert",
        badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
        values: {
            soilMoisture: 31.0,
            temperature: 28.4,
            humidity: 82.0,
            lightLux: 650,
            batteryPercent: 91,
            batteryVoltage: 4.08,
            rainfall: 2.5
        },
        alert: {
            title: "Current weather conditions may favour fungal disease",
            whatIsHappening: "Air humidity has remained high at 82% with canopy temperature at 28.4°C.",
            whyItMatters: "Prolonged leaf dampness and warm ambient air create ideal conditions for fungal spores to germinate and spread.",
            whatFarmerShouldDo: "Inspect lower foliage for discolored lesions or powdery spots during morning walks; avoid overhead sprinkling."
        },
        advice: {
            action: "Delay foliar spraying & monitor leaf undersides",
            reason: "High humidity (>80%) creates damp microclimate around dense foliage. Water only at root base.",
            nextCheck: "Check foliage tomorrow at 7:00 AM."
        }
    },
    low_moisture: {
        key: "low_moisture",
        name: "Low Soil Moisture (Irrigation Warning)",
        badge: "Irrigation Needed",
        badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
        values: {
            soilMoisture: 21.5,
            temperature: 31.0,
            humidity: 42.0,
            lightLux: 840,
            batteryPercent: 90,
            batteryVoltage: 4.05,
            rainfall: 0.0
        },
        alert: {
            title: "Your soil may need water",
            whatIsHappening: "Soil moisture in the root zone has dropped to 21.5%, which is below the safe threshold.",
            whyItMatters: "Crop roots cannot take up water quickly enough during warm daytime hours, leading to wilting and slowed nutrient uptake.",
            whatFarmerShouldDo: "Schedule light irrigation today, preferably early morning or late afternoon when evaporation is lowest."
        },
        advice: {
            action: "Run light irrigation today (early morning / late afternoon)",
            reason: "Root-zone moisture is at 21.5%. Plants risk moisture stress if unwatered before midday heat.",
            nextCheck: "Re-check soil moisture immediately after irrigation."
        }
    },
    normal: {
        key: "normal",
        name: "Normal Conditions",
        badge: "Optimal Field Balance",
        badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
        values: {
            soilMoisture: 46.0,
            temperature: 24.2,
            humidity: 58.0,
            lightLux: 720,
            batteryPercent: 93,
            batteryVoltage: 4.15,
            rainfall: 0.0
        },
        alert: {
            title: "Optimal Growing Conditions",
            whatIsHappening: "Soil moisture and weather conditions are well balanced for healthy crop growth.",
            whyItMatters: "Roots have consistent access to water and oxygen without waterlogging or dryness stress.",
            whatFarmerShouldDo: "Continue standard monitoring. No irrigation or emergency interventions required today."
        },
        advice: {
            action: "No irrigation required today",
            reason: "Soil moisture (46%) is in the optimal root-zone comfort band for active growth.",
            nextCheck: "Check again tomorrow morning."
        }
    },
    high_temperature: {
        key: "high_temperature",
        name: "High Temperature (Heat Stress)",
        badge: "Heat Stress Warning",
        badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
        values: {
            soilMoisture: 25.8,
            temperature: 38.6,
            humidity: 33.0,
            lightLux: 950,
            batteryPercent: 88,
            batteryVoltage: 3.98,
            rainfall: 0.0
        },
        alert: {
            title: "Midday Heat Stress Warning",
            whatIsHappening: "Field temperature has reached 38.6°C with intense solar radiation (950 lux).",
            whyItMatters: "Excessive heat causes rapid water loss through transpiration, causing temporary wilting and reduced photosynthesis.",
            whatFarmerShouldDo: "Avoid spraying fertilizers or agrochemicals during peak midday hours; ensure soil has sufficient moisture or mulch."
        },
        advice: {
            action: "Avoid midday chemical sprays & maintain root hydration",
            reason: "Air temperature (38.6°C) can cause chemical foliar burn. Spray only after sunset or early dawn.",
            nextCheck: "Check plant canopy vigor in late afternoon."
        }
    }
};

export default function FieldIntelligence() {
    const { activePlot } = useFarmContext();

    const [mode, setMode] = useState("simulated"); // 'simulated', 'manual', 'hardware'
    const [scenario, setScenario] = useState("high_humidity");
    const [isStreamPaused, setIsStreamPaused] = useState(false);
    const [lastReadingTime, setLastReadingTime] = useState(new Date());

    // Deterministic initial values
    const [telemetry, setTelemetry] = useState({
        mode: "SIMULATION",
        deviceStatus: "ESP32 — DEMO MODE",
        isSimulated: true,
        soilMoisture: 31.0,
        temperature: 28.4,
        humidity: 82.0,
        lightLux: 650,
        batteryPercent: 91,
        batteryVoltage: 4.08,
        rainfall: 2.5
    });

    const [advisory, setAdvisory] = useState({
        alert: SCENARIOS.high_humidity.alert,
        advice: SCENARIOS.high_humidity.advice
    });

    // Recent historical readings for live trend chart
    const [history, setHistory] = useState([
        { time: "09:00", moisture: 33.2, temp: 26.5, hum: 85 },
        { time: "09:30", moisture: 32.8, temp: 27.0, hum: 84 },
        { time: "10:00", moisture: 32.2, temp: 27.5, hum: 83 },
        { time: "10:30", moisture: 31.8, temp: 28.0, hum: 83 },
        { time: "11:00", moisture: 31.4, temp: 28.2, hum: 82 },
        { time: "11:30", moisture: 31.0, temp: 28.4, hum: 82 }
    ]);

    const [isLoading, setIsLoading] = useState(false);
    const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

    // Manual Input Modal
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        soilMoisture: 38,
        temperature: 28,
        humidity: 62,
        lightLux: 650,
        rainfall: 0,
        soilBallFeel: "Moist ball forms, does not crumble"
    });

    // Helper to generate a new reading based on current scenario with slight natural jitter
    const generateReading = useCallback((targetScenario = scenario) => {
        const base = SCENARIOS[targetScenario] || SCENARIOS.high_humidity;
        const jitterM = (Math.random() * 0.6 - 0.3);
        const jitterT = (Math.random() * 0.4 - 0.2);
        const jitterH = (Math.random() * 1.0 - 0.5);

        const newM = Math.round((base.values.soilMoisture + jitterM) * 10) / 10;
        const newT = Math.round((base.values.temperature + jitterT) * 10) / 10;
        const newH = Math.round(Math.min(100, Math.max(10, base.values.humidity + jitterH)) * 10) / 10;

        const now = new Date();
        setLastReadingTime(now);

        setTelemetry({
            mode: "SIMULATION",
            deviceStatus: "ESP32 — DEMO MODE",
            isSimulated: true,
            soilMoisture: newM,
            temperature: newT,
            humidity: newH,
            lightLux: base.values.lightLux,
            batteryPercent: base.values.batteryPercent,
            batteryVoltage: base.values.batteryVoltage,
            rainfall: base.values.rainfall
        });

        setAdvisory({
            alert: base.alert,
            advice: base.advice
        });

        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setHistory(prev => {
            const next = [...prev, { time: timeStr, moisture: newM, temp: newT, hum: newH }];
            return next.slice(-8); // Keep last 8 points
        });
    }, [scenario]);

    // Handle switching instant scenarios
    const handleSelectScenario = (key) => {
        setScenario(key);
        setMode("simulated");
        const sc = SCENARIOS[key];
        if (sc) {
            setLastReadingTime(new Date());
            setTelemetry({
                mode: "SIMULATION",
                deviceStatus: "ESP32 — DEMO MODE",
                isSimulated: true,
                soilMoisture: sc.values.soilMoisture,
                temperature: sc.values.temperature,
                humidity: sc.values.humidity,
                lightLux: sc.values.lightLux,
                batteryPercent: sc.values.batteryPercent,
                batteryVoltage: sc.values.batteryVoltage,
                rainfall: sc.values.rainfall
            });
            setAdvisory({
                alert: sc.alert,
                advice: sc.advice
            });
            const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
            setHistory(prev => [
                ...prev.slice(-7),
                { time: timeStr, moisture: sc.values.soilMoisture, temp: sc.values.temperature, hum: sc.values.humidity }
            ]);
            toast.success(`Switched to ${sc.name}`);
        }
    };

    // Auto-stream interval (every 6 seconds if not paused and in simulation mode)
    useEffect(() => {
        if (mode !== "simulated" || isStreamPaused) return;

        const interval = setInterval(() => {
            generateReading(scenario);
        }, 6000);

        return () => clearInterval(interval);
    }, [mode, isStreamPaused, scenario, generateReading]);

    // Server-sync (optional, keeps backend in sync if running)
    const fetchServerReadings = useCallback(async (currentMode = mode, currentScenario = scenario) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/iot/readings?mode=${currentMode}&scenario=${currentScenario}`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const data = await res.json();
            if (res.ok && data.readings) {
                if (currentMode === "hardware") {
                    setTelemetry(data.readings);
                }
            }
        } catch {
            // Keep deterministic local values cleanly
        } finally {
            setIsLoading(false);
        }
    }, [mode, scenario]);

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
                setTelemetry({
                    mode: "MANUAL",
                    deviceStatus: "MANUAL OBSERVATION",
                    isSimulated: false,
                    soilMoisture: manualForm.soilMoisture,
                    temperature: manualForm.temperature,
                    humidity: manualForm.humidity,
                    lightLux: manualForm.lightLux,
                    batteryPercent: null,
                    batteryVoltage: null,
                    rainfall: manualForm.rainfall
                });
            } else {
                toast.error(data.error || "Failed to record observation");
            }
        } catch {
            // Local fallback
            toast.success("Manual observations recorded (local)");
            setIsManualModalOpen(false);
            setMode("manual");
            setTelemetry({
                mode: "MANUAL",
                deviceStatus: "MANUAL OBSERVATION",
                isSimulated: false,
                soilMoisture: manualForm.soilMoisture,
                temperature: manualForm.temperature,
                humidity: manualForm.humidity,
                lightLux: manualForm.lightLux,
                batteryPercent: null,
                batteryVoltage: null,
                rainfall: manualForm.rainfall
            });
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
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-bold mb-2">
                                <MdOutlineSensors className="text-sm" />
                                <span>FIELD INTELLIGENCE &amp; SENSOR STREAM</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Field Readings &amp; Watering Guide
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Real-time soil moisture and canopy weather telemetry for {activePlot?.name || "Main Field"} ({activePlot?.crop || "Wheat"}).
                            </p>
                        </div>

                        {/* Mode Selector */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm text-xs">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("simulated");
                                        handleSelectScenario(scenario);
                                    }}
                                    className={`px-4 py-1.5 rounded-full font-bold transition ${
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
                                    className={`px-4 py-1.5 rounded-full font-bold transition ${
                                        mode === "manual"
                                            ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                            : "text-[#545850] hover:text-[#590907]"
                                    }`}
                                >
                                    Manual Input
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode("hardware");
                                        fetchServerReadings("hardware");
                                    }}
                                    className={`px-4 py-1.5 rounded-full font-bold transition ${
                                        mode === "hardware"
                                            ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                            : "text-[#545850] hover:text-[#590907]"
                                    }`}
                                >
                                    ESP32 Hardware
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DEVICE STATUS & SIMULATED DATA INDICATOR BAR */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border bg-white border-[#A5A79B]/30 shadow-xs text-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${
                                mode === "hardware"
                                    ? "bg-rose-500"
                                    : mode === "manual"
                                    ? "bg-blue-500"
                                    : isStreamPaused
                                    ? "bg-amber-400"
                                    : "bg-emerald-500 animate-pulse"
                            }`} />
                            <span className="font-extrabold tracking-wide text-[#1C1E1B]">
                                {mode === "hardware"
                                    ? "ESP32 — HARDWARE OFFLINE"
                                    : mode === "manual"
                                    ? "MANUAL OBSERVATION MODE"
                                    : "ESP32 — DEMO MODE"}
                            </span>
                        </div>

                        {mode === "simulated" && (
                            <span className="px-2.5 py-0.5 rounded-md font-bold tracking-wider text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                                SIMULATED DATA
                            </span>
                        )}

                        <span className="text-[#545850] hidden sm:inline">•</span>
                        <span className="text-[#545850] hidden sm:inline flex items-center gap-1">
                            <RiTimeLine /> Last reading: {lastReadingTime.toLocaleTimeString()}
                        </span>
                    </div>

                    {mode === "simulated" && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsStreamPaused(!isStreamPaused)}
                                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition ${
                                    isStreamPaused
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                                        : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
                                }`}
                            >
                                {isStreamPaused ? (
                                    <>
                                        <RiPlayCircleLine className="text-sm" /> Resume Stream
                                    </>
                                ) : (
                                    <>
                                        <RiPauseCircleLine className="text-sm" /> Pause Stream
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => generateReading(scenario)}
                                className="px-3 py-1.5 rounded-lg bg-[#590907] text-[#FDFBF7] font-semibold flex items-center gap-1 hover:bg-[#420605] transition"
                            >
                                <RiRefreshLine className={isLoading ? "animate-spin" : ""} /> Generate New Reading
                            </button>
                        </div>
                    )}

                    {mode === "manual" && (
                        <button
                            type="button"
                            onClick={() => setIsManualModalOpen(true)}
                            className="px-3.5 py-1.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold flex items-center gap-1"
                        >
                            <FaEdit /> Enter Today's Reading
                        </button>
                    )}
                </div>

                {/* HARDWARE MODE OFFLINE WARNING (HONEST NOTICE) */}
                {mode === "hardware" && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex items-start gap-3 text-xs leading-relaxed">
                        <RiAlertLine className="text-base text-rose-700 shrink-0 mt-0.5" />
                        <div>
                            <strong className="block font-bold mb-0.5">No active physical ESP32 sensor detected</strong>
                            <p>
                                The system is waiting for incoming telemetry webhooks from a field micro-controller. To demonstrate live alerts and sensor behaviors without physical hardware, switch to <strong>Demo Simulation</strong>.
                            </p>
                        </div>
                    </div>
                )}

                {/* FOUR INSTANT DEMONSTRATION SCENARIOS */}
                {mode === "simulated" && (
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 mb-8 shadow-xs">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3.5">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-[#590907] flex items-center gap-1.5">
                                    <FaSlidersH /> Instant Demonstration Scenarios
                                </span>
                                <p className="text-xs text-[#545850]">
                                    Click any scenario to instantly simulate environmental extremes and verify real-time alert explanations.
                                </p>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#E8D2B5]/40 text-[#590907]">
                                Active: {SCENARIOS[scenario]?.name}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            {Object.values(SCENARIOS).map((sc) => {
                                const isSelected = scenario === sc.key;
                                return (
                                    <button
                                        key={sc.key}
                                        type="button"
                                        onClick={() => handleSelectScenario(sc.key)}
                                        className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                                            isSelected
                                                ? "bg-[#590907] text-[#FDFBF7] border-[#590907] shadow-sm ring-2 ring-[#590907]/20"
                                                : "bg-[#FDFBF7] text-[#1C1E1B] border-[#A5A79B]/30 hover:border-[#590907]/50 hover:bg-white"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-1 mb-1.5">
                                            <span className="font-bold text-xs leading-snug">{sc.name}</span>
                                            {isSelected && <FaCheck className="text-xs text-[#E8D2B5] shrink-0 mt-0.5" />}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] opacity-90">
                                            <span>M: {sc.values.soilMoisture}%</span>
                                            <span>•</span>
                                            <span>T: {sc.values.temperature}°C</span>
                                            <span>•</span>
                                            <span>H: {sc.values.humidity}%</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3-PART FARMER-FRIENDLY EXPLAINABLE ALERT BANNER */}
                {advisory?.alert && mode !== "hardware" && (
                    <div className="bg-gradient-to-br from-amber-50/90 via-white to-[#E8D2B5]/30 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-7 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-4 border-b border-amber-900/10">
                            <div>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 mb-1.5">
                                    <RiAlertLine /> Farmer-Friendly Advisory
                                </div>
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1E1B]">
                                    {advisory.alert.title}
                                </h2>
                            </div>
                            <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#A5A79B]/40 text-[#590907] text-xs font-bold flex items-center gap-1.5 shadow-xs">
                                <MdWaterDrop className="text-sm" />
                                <span>Field Action: {advisory.advice?.action || "Monitor Closely"}</span>
                            </div>
                        </div>

                        {/* Structured 3-Part Explanation: What? Why? What Should I Do? */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs">
                            <div className="p-4 rounded-xl bg-white border border-[#A5A79B]/30 shadow-xs">
                                <span className="font-extrabold text-[#590907] uppercase tracking-wide block mb-1">
                                    1. What is happening?
                                </span>
                                <p className="text-[#545850] leading-relaxed">
                                    {advisory.alert.whatIsHappening}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-white border border-[#A5A79B]/30 shadow-xs">
                                <span className="font-extrabold text-[#1C1E1B] uppercase tracking-wide block mb-1">
                                    2. Why does it matter?
                                </span>
                                <p className="text-[#545850] leading-relaxed">
                                    {advisory.alert.whyItMatters}
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 shadow-xs">
                                <span className="font-extrabold text-emerald-900 uppercase tracking-wide block mb-1">
                                    3. What should the farmer do?
                                </span>
                                <p className="text-emerald-950 font-medium leading-relaxed">
                                    {advisory.alert.whatFarmerShouldDo}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5 SENSOR METRIC CARDS WITH UNITS & TIMESTAMPS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {/* 1. Soil Moisture */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Soil Moisture
                                </span>
                                <RiDropLine className="text-xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.soilMoisture ?? "--"}
                                    <span className="text-sm font-sans font-normal text-[#545850] ml-1">%</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {telemetry?.soilMoisture < 25 ? "Dry (Low)" : telemetry?.soilMoisture > 55 ? "Saturated" : "Comfortable"}
                            </div>

                            <p className="text-xs text-[#545850] border-t border-[#A5A79B]/20 pt-2 leading-relaxed">
                                Volumetric water content in top 15cm root-zone.
                            </p>
                        </div>
                        <span className="text-[10px] text-[#A5A79B] mt-2 block">
                            Updated: {lastReadingTime.toLocaleTimeString()}
                        </span>
                    </div>

                    {/* 2. Temperature */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Air Temperature
                                </span>
                                <WiDaySunny className="text-2xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.temperature ?? "--"}
                                    <span className="text-sm font-sans font-normal text-[#545850] ml-1">°C</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2.5 bg-blue-100 text-blue-900 border border-blue-300">
                                {telemetry?.temperature > 35 ? "Heat Stress" : telemetry?.temperature < 15 ? "Cool" : "Optimal"}
                            </div>

                            <p className="text-xs text-[#545850] border-t border-[#A5A79B]/20 pt-2 leading-relaxed">
                                Ambient temperature at field canopy height.
                            </p>
                        </div>
                        <span className="text-[10px] text-[#A5A79B] mt-2 block">
                            Updated: {lastReadingTime.toLocaleTimeString()}
                        </span>
                    </div>

                    {/* 3. Humidity */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Relative Humidity
                                </span>
                                <WiHumidity className="text-2xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.humidity ?? "--"}
                                    <span className="text-sm font-sans font-normal text-[#545850] ml-1">%</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2.5 bg-amber-100 text-amber-900 border border-amber-300">
                                {telemetry?.humidity > 75 ? "High (Fungal Risk)" : "Moderate"}
                            </div>

                            <p className="text-xs text-[#545850] border-t border-[#A5A79B]/20 pt-2 leading-relaxed">
                                Moisture vapor in ambient air surrounding crop leaves.
                            </p>
                        </div>
                        <span className="text-[10px] text-[#A5A79B] mt-2 block">
                            Updated: {lastReadingTime.toLocaleTimeString()}
                        </span>
                    </div>

                    {/* 4. Light Intensity */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Solar Radiation
                                </span>
                                <RiSunLine className="text-xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.lightLux ?? 650}
                                    <span className="text-sm font-sans font-normal text-[#545850] ml-1">lux</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2.5 bg-[#E8D2B5]/50 text-[#1C1E1B] border border-[#A5A79B]/30">
                                {telemetry?.lightLux > 800 ? "Bright Sun" : "Moderate Sun"}
                            </div>

                            <p className="text-xs text-[#545850] border-t border-[#A5A79B]/20 pt-2 leading-relaxed">
                                Photosynthetically active light reaching field canopy.
                            </p>
                        </div>
                        <span className="text-[10px] text-[#A5A79B] mt-2 block">
                            Updated: {lastReadingTime.toLocaleTimeString()}
                        </span>
                    </div>

                    {/* 5. Battery Node Status */}
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-xs font-bold text-[#590907] uppercase tracking-wider">
                                    Sensor Battery
                                </span>
                                <RiBattery2ChargeLine className="text-xl text-[#590907]" />
                            </div>

                            <div className="my-2">
                                <span className="text-3xl font-serif font-bold text-[#1C1E1B]">
                                    {telemetry?.batteryPercent ?? 91}
                                    <span className="text-sm font-sans font-normal text-[#545850] ml-1">%</span>
                                </span>
                            </div>

                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold mb-2.5 bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {telemetry?.batteryVoltage ?? 4.08}V (Solar Backed)
                            </div>

                            <p className="text-xs text-[#545850] border-t border-[#A5A79B]/20 pt-2 leading-relaxed">
                                Field node Li-Po battery charged via solar cell.
                            </p>
                        </div>
                        <span className="text-[10px] text-[#A5A79B] mt-2 block">
                            Node: ESP32-WROOM-32D
                        </span>
                    </div>
                </div>

                {/* LIVE HISTORICAL TREND CHART (RESPONSIVE SVG) */}
                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 mb-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 pb-3 border-b border-[#A5A79B]/20">
                        <div>
                            <h3 className="font-serif font-bold text-base text-[#1C1E1B] flex items-center gap-2">
                                <FaHistory className="text-[#590907]" />
                                <span>Recent Telemetry Trend (Live Stream History)</span>
                            </h3>
                            <p className="text-xs text-[#545850]">
                                Dynamic chart tracking Soil Moisture (%), Canopy Temperature (°C), and Humidity (%) across consecutive readings.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5 text-blue-700">
                                <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Soil Moisture (%)
                            </span>
                            <span className="flex items-center gap-1.5 text-rose-700">
                                <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Temperature (°C)
                            </span>
                            <span className="flex items-center gap-1.5 text-amber-700">
                                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Humidity (%)
                            </span>
                        </div>
                    </div>

                    {/* SVG Chart */}
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[600px] h-48 relative">
                            <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
                                {/* Grid lines */}
                                <line x1="40" y1="20" x2="580" y2="20" stroke="#E5E7EB" strokeDasharray="3 3" />
                                <line x1="40" y1="60" x2="580" y2="60" stroke="#E5E7EB" strokeDasharray="3 3" />
                                <line x1="40" y1="100" x2="580" y2="100" stroke="#E5E7EB" strokeDasharray="3 3" />
                                <line x1="40" y1="140" x2="580" y2="140" stroke="#E5E7EB" strokeDasharray="3 3" />

                                {/* Y-axis Labels */}
                                <text x="10" y="24" className="text-[10px] fill-[#9CA3AF] font-sans">100</text>
                                <text x="15" y="64" className="text-[10px] fill-[#9CA3AF] font-sans">60</text>
                                <text x="15" y="104" className="text-[10px] fill-[#9CA3AF] font-sans">40</text>
                                <text x="15" y="144" className="text-[10px] fill-[#9CA3AF] font-sans">20</text>

                                {/* Polyline: Moisture */}
                                <polyline
                                    fill="none"
                                    stroke="#2563EB"
                                    strokeWidth="2.5"
                                    points={history.map((pt, idx) => {
                                        const x = 50 + (idx * (520 / Math.max(1, history.length - 1)));
                                        const y = 160 - (pt.moisture * 1.4);
                                        return `${x},${y}`;
                                    }).join(" ")}
                                />

                                {/* Polyline: Temperature */}
                                <polyline
                                    fill="none"
                                    stroke="#E11D48"
                                    strokeWidth="2.5"
                                    points={history.map((pt, idx) => {
                                        const x = 50 + (idx * (520 / Math.max(1, history.length - 1)));
                                        const y = 160 - (pt.temp * 3.0);
                                        return `${x},${y}`;
                                    }).join(" ")}
                                />

                                {/* Polyline: Humidity */}
                                <polyline
                                    fill="none"
                                    stroke="#D97706"
                                    strokeWidth="2.5"
                                    points={history.map((pt, idx) => {
                                        const x = 50 + (idx * (520 / Math.max(1, history.length - 1)));
                                        const y = 160 - (pt.hum * 1.4);
                                        return `${x},${y}`;
                                    }).join(" ")}
                                />

                                {/* Data Points and Labels */}
                                {history.map((pt, idx) => {
                                    const x = 50 + (idx * (520 / Math.max(1, history.length - 1)));
                                    const yM = 160 - (pt.moisture * 1.4);
                                    return (
                                        <g key={idx}>
                                            <circle cx={x} cy={yM} r="4" fill="#2563EB" />
                                            <text x={x} y="175" textAnchor="middle" className="text-[9px] fill-[#6B7280]">
                                                {pt.time}
                                            </text>
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    </div>
                </div>

                {/* EXPANDABLE TECHNICAL DETAILS (FAO-56 CALCULATIONS) */}
                <div className="border border-[#A5A79B]/30 rounded-2xl bg-white overflow-hidden shadow-xs">
                    <button
                        type="button"
                        onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                        className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-[#545850] hover:text-[#1C1E1B] hover:bg-[#FDFBF7] transition"
                    >
                        <span>Detailed Technical Agronomic Measurements (FAO-56 Water Balance Framework)</span>
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
                                    <span className="block font-medium">Microcontroller Node</span>
                                    <span className="font-bold text-[#1C1E1B]">ESP32 Wi-Fi / MQTT</span>
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
