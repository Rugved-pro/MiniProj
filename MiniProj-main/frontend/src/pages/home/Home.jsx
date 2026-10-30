import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavbarHome from "../../components/navbars/Navbar-home";
import Footer from "../../components/Footer";
import Spinner2 from "../../components/Spinner2";
import TelegramBotPanel from "../../components/TelegramBotPanel";
import { useAuthContext } from "../../context/AuthContext";
import { useFarmContext } from "../../context/FarmContext";
import useGetMyHistory from "../../hooks/useGetMyHistory";
import { fetchIPInfo } from "../../utils/getLocationAndWeatherData";
import { getLiveCurrentWeather } from "../../utils/getTempAndHum";
import formattedDate from "../../utils/formattedDate";
import {
  RiPlantLine,
  RiShieldCheckLine,
  RiAlertLine,
  RiCompass3Line,
  RiCalendarEventLine,
  RiStore2Line,
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
  RiSparklingLine,
  RiArrowRightLine
} from "react-icons/ri";
import {
  MdOutlineSensors,
  MdOutlineStorefront,
  MdOutlineRefresh,
  MdOutlineSwapHoriz
} from "react-icons/md";
import { WiDaySunny } from "react-icons/wi";
import "./Home.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const Home = () => {
  const { authUser } = useAuthContext();
  const { farmProfile, activePlot, plots, switchPlot } = useFarmContext();
  const { history } = useGetMyHistory();

  const [loading, setLoading] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [refreshingWeather, setRefreshingWeather] = useState(false);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [historyRecords, location] = await Promise.allSettled([
          history(),
          fetchIPInfo({ allowFallback: false }),
        ]);

        if (isMounted) {
          if (historyRecords.status === "fulfilled" && Array.isArray(historyRecords.value)) {
            setRecentScans(historyRecords.value.slice(-4).reverse());
          }
          const currentLocation = location.status === "fulfilled" ? location.value : null;
          const currentWeather = currentLocation
            ? await getLiveCurrentWeather(currentLocation)
            : null;
          if (isMounted) {
            setLocationData(currentLocation);
            setWeatherData(currentWeather);
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [history]);

  // Fetch daily tasks for active plot
  useEffect(() => {
    let active = true;
    async function loadTasks() {
      setTasksLoading(true);
      try {
        const crop = activePlot?.crop || "Wheat";
        const stage = activePlot?.growthStage || "Vegetative";
        const res = await fetch(`${API_BASE}/intelligence/tasks?crop=${encodeURIComponent(crop)}&stage=${encodeURIComponent(stage)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.tasks) {
            setDailyTasks(data.tasks.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn("Could not load tasks:", err);
      } finally {
        if (active) setTasksLoading(false);
      }
    }

    loadTasks();
    return () => { active = false; };
  }, [activePlot]);

  const refreshWeather = async () => {
    setRefreshingWeather(true);
    try {
      let currentLocation = locationData;
      if (!currentLocation) {
        currentLocation = await fetchIPInfo({ allowFallback: false });
        setLocationData(currentLocation);
      }
      setWeatherData(currentLocation ? await getLiveCurrentWeather(currentLocation) : null);
    } finally {
      setRefreshingWeather(false);
    }
  };

  const toggleTask = (taskId) => {
    setDailyTasks(prev =>
      prev.map(t => t.id === taskId ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7EFE4] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner2 />
          <span className="text-xs font-semibold text-[#545850]">Loading Ceres Field Intelligence...</span>
        </div>
      </div>
    );
  }

  // Derive Microclimate Risk
  const tempC = weatherData?.temperatureC ?? null;
  const humidity = weatherData?.humidity ?? null;
  const isFungalRiskElevated = humidity !== null && humidity >= 70 && tempC !== null && tempC >= 20 && tempC <= 29;

  const farmerDisplayName = farmProfile?.farmerName || authUser?.name || "Farmer";
  const farmerLocation = farmProfile?.district
    ? `${farmProfile.district}, ${farmProfile.state}`
    : locationData?.city
      ? `${locationData.city}, ${locationData.region || "Maharashtra"}`
      : "Maharashtra Region";

  return (
    <div className="home min-h-screen bg-[#F7EFE4] text-[#1C1E1B]">
      <NavbarHome />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome & Farm Profile Header */}
        <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#590907] mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#590907] animate-pulse"></span>
                <span>Ceres Agricultural Intelligence Platform</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                Namaste, {farmerDisplayName}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-[#545850] mt-1.5">
                <span>
                  Region: <strong className="text-[#1C1E1B]">{farmerLocation}</strong>
                </span>
                {farmProfile?.totalAreaAcres && (
                  <span>
                    • Total Land: <strong className="text-[#1C1E1B]">{farmProfile.totalAreaAcres} Acres</strong>
                  </span>
                )}
                <Link to="/my-farm" className="text-[#590907] font-semibold hover:underline flex items-center gap-1">
                  <RiCompass3Line /> Manage Farm Profile
                </Link>
              </div>
            </div>

            {/* Active Plot Pill & Switcher */}
            <div className="bg-[#F7EFE4] border border-[#A5A79B]/30 rounded-xl p-3 sm:p-4 min-w-[260px]">
              <div className="flex items-center justify-between text-xs text-[#545850] mb-1.5">
                <span className="font-semibold text-[#590907] uppercase tracking-wider text-[10px]">Active Plot Context</span>
                {plots.length > 1 && (
                  <label className="text-[11px] flex items-center gap-1 text-[#590907] cursor-pointer">
                    <MdOutlineSwapHoriz /> Switch
                  </label>
                )}
              </div>

              {plots.length > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1C1E1B]">
                      {activePlot?.name || "Main Field"}
                    </h3>
                    <p className="text-xs text-[#545850]">
                      {activePlot?.crop || "Wheat"} ({activePlot?.variety || "Standard"}) • {activePlot?.growthStage || "Vegetative"}
                    </p>
                  </div>
                  {plots.length > 1 && (
                    <select
                      value={activePlot?._id || ""}
                      onChange={(e) => switchPlot(e.target.value)}
                      className="text-xs py-1 px-2 rounded border border-[#A5A79B]/40 bg-[#FDFBF7] text-[#1C1E1B]"
                    >
                      {plots.map((p) => (
                        <option key={p._id} value={p._id}>{p.name} ({p.crop})</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div>
                  <span className="text-xs text-[#545850] block">No plot configured yet.</span>
                  <Link to="/my-farm" className="text-xs text-[#590907] font-semibold underline mt-1 inline-block">
                    Add Your First Field Plot →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Workflow Buttons */}
          <div className="mt-6 pt-5 border-t border-[#A5A79B]/20 flex flex-wrap gap-2.5">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow-sm hover:bg-[#420605] transition"
            >
              <RiPlantLine className="text-sm" />
              <span>Diagnose Crop Leaf</span>
            </Link>
            <Link
              to="/field-intelligence"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/40 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
            >
              <MdOutlineSensors className="text-sm text-[#590907]" />
              <span>Field & Soil Intel</span>
            </Link>
            <Link
              to="/crop-planning"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/40 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
            >
              <RiCalendarEventLine className="text-sm text-[#590907]" />
              <span>Daily Tasks & Planning</span>
            </Link>
            <Link
              to="/market-harvest"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/40 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
            >
              <RiStore2Line className="text-sm text-[#590907]" />
              <span>Mandi Prices & Yield</span>
            </Link>
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/40 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
            >
              <MdOutlineStorefront className="text-sm text-[#590907]" />
              <span>Marketplace</span>
            </Link>
            <Link
              to="/assistant"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E8D2B5]/40 text-[#590907] border border-[#590907]/20 font-semibold text-xs hover:bg-[#E8D2B5]/70 transition ml-auto"
            >
              <RiSparklingLine className="text-sm" />
              <span>Agronomist Assistant</span>
            </Link>
          </div>
        </div>

        {/* Middle Row: Environmental Telemetry + "What Should I Do Today?" */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Microclimate Telemetry Card (7 cols) */}
          <div className="lg:col-span-7 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#A5A79B]/25 mb-4">
                <div className="flex items-center gap-2">
                  <WiDaySunny className="text-2xl text-[#590907]" />
                  <div>
                    <h2 className="text-sm font-bold text-[#1C1E1B]">Local Microclimate & Soil Risk</h2>
                    <span className="text-[11px] text-[#545850]">
                      {weatherData?.time ? `Live Open-Meteo · Updated ${weatherData.time}` : "Live weather station telemetry"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={refreshWeather}
                  disabled={refreshingWeather}
                  className="text-xs text-[#545850] hover:text-[#590907] flex items-center gap-1 transition"
                  title="Refresh weather"
                >
                  <MdOutlineRefresh className={`text-base ${refreshingWeather ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25">
                  <span className="text-[11px] text-[#545850] block">Ambient Temp</span>
                  <span className="text-lg font-bold text-[#1C1E1B]">
                    {tempC !== null ? `${tempC.toFixed(1)}°C` : "Unavailable"}
                  </span>
                  <span className="text-[10px] text-[#A5A79B] block">Live · Open-Meteo</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25">
                  <span className="text-[11px] text-[#545850] block">Humidity</span>
                  <span className="text-lg font-bold text-[#1C1E1B]">
                    {humidity !== null ? `${humidity}%` : "Unavailable"}
                  </span>
                  <span className="text-[10px] text-[#A5A79B] block">Relative</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25">
                  <span className="text-[11px] text-[#545850] block">Location</span>
                  <span className="text-lg font-bold text-[#1C1E1B] truncate block" title={farmerLocation}>
                    {locationData?.city || farmProfile?.district || "Maharashtra"}
                  </span>
                  <span className="text-[10px] text-[#A5A79B] block">Station node</span>
                </div>

                <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25">
                  <span className="text-[11px] text-[#545850] block">Soil Profile</span>
                  <span className="text-lg font-bold text-[#1C1E1B]">
                    {activePlot?.soilType || "Clay Loam"}
                  </span>
                  <span className="text-[10px] text-emerald-800 font-medium block">
                    pH 6.8 · Neutral
                  </span>
                </div>
              </div>

              {/* Explainable risk callout */}
              {!weatherData ? (
                <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex items-start gap-2.5">
                    <RiAlertLine className="text-gray-500 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-gray-800 block">Live Telemetry Pending</strong>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                        Current temperature and humidity readings could not be retrieved automatically. Click refresh above to query Open-Meteo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isFungalRiskElevated ? (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2.5">
                    <RiAlertLine className="text-amber-700 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-amber-900 block">Elevated Fungal Spore Risk</strong>
                      <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                        High ambient humidity ({humidity}%) and warm weather ({tempC.toFixed(1)}°C) create prime conditions for leaf rust and powdery mildew. Inspect lower leaf surfaces.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <div className="flex items-start gap-2.5">
                    <RiShieldCheckLine className="text-emerald-700 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-emerald-900 block">Microclimate Fungal Spore Risk: Low</strong>
                      <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                        Current canopy humidity and thermal values remain within standard vegetative tolerance ranges.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 mt-4 border-t border-[#A5A79B]/20 flex items-center justify-between text-xs">
              <span className="text-[#545850]">Hardware / Simulated FAO-56 sensor modes available</span>
              <Link to="/field-intelligence" className="text-[#590907] font-semibold hover:underline">
                View Full Field Intelligence →
              </Link>
            </div>
          </div>

          {/* Today's Checklist Widget (5 cols) */}
          <div className="lg:col-span-5 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#A5A79B]/25 mb-3">
                <div className="flex items-center gap-2">
                  <RiCalendarEventLine className="text-lg text-[#590907]" />
                  <h2 className="text-sm font-bold text-[#1C1E1B]">What Should I Do Today?</h2>
                </div>
                <Link to="/crop-planning" className="text-xs text-[#590907] font-semibold hover:underline">
                  All Tasks →
                </Link>
              </div>

              <p className="text-xs text-[#545850] mb-3">
                Tailored for <strong>{activePlot?.crop || "Wheat"}</strong> in the <strong>{activePlot?.growthStage || "Vegetative"}</strong> stage:
              </p>

              {tasksLoading ? (
                <div className="py-6 text-center text-xs text-[#545850]">Loading agricultural checklist...</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {dailyTasks.map((task) => {
                    const isDone = task.status === "completed";
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                          isDone
                            ? "bg-emerald-50/50 border-emerald-200 text-[#545850]"
                            : "bg-[#F7EFE4]/60 border-[#A5A79B]/30 hover:border-[#590907]/40 text-[#1C1E1B]"
                        }`}
                      >
                        <button type="button" className="text-base text-[#590907] mt-0.5 shrink-0">
                          {isDone ? <RiCheckboxCircleLine className="text-emerald-700" /> : <RiCheckboxBlankCircleLine className="text-[#A5A79B]" />}
                        </button>
                        <div className="flex-1">
                          <span className={`font-semibold block ${isDone ? "line-through text-[#545850]" : ""}`}>
                            {task.title}
                          </span>
                          <span className="text-[11px] text-[#545850] line-clamp-1">
                            {task.explanation || task.description}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 mt-3 border-t border-[#A5A79B]/20 flex items-center justify-between text-xs">
              <span className="text-[#545850]">Fertilizer recommendations & plantation calendar</span>
              <Link to="/crop-planning" className="text-[#590907] font-semibold hover:underline">
                Open Planner →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Crop Health Assessments Section */}
        <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#A5A79B]/25 mb-6">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#1C1E1B]">Recent Crop Assessments</h2>
              <p className="text-xs text-[#545850]">Verified diagnoses evaluated with our deep learning disease model</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[#590907] hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <RiArrowRightLine />
            </Link>
          </div>

          {recentScans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentScans.map((scan, idx) => {
                const isHealthy = !scan.disease || scan.disease.toLowerCase() === "healthy";
                return (
                  <div
                    key={scan._id || idx}
                    className="border border-[#A5A79B]/30 rounded-xl overflow-hidden bg-[#FDFBF7] hover:border-[#590907]/40 transition shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="h-36 w-full bg-[#E8D2B5]/30 relative overflow-hidden">
                        {scan.url ? (
                          <img
                            src={scan.url}
                            alt={scan.crop || "Crop Scan"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A5A79B]">
                            <RiPlantLine className="text-3xl" />
                          </div>
                        )}
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                            isHealthy
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          {isHealthy ? "Healthy" : "Affected"}
                        </span>
                      </div>

                      <div className="p-3.5">
                        <strong className="text-sm text-[#1C1E1B] block mb-0.5">
                          {scan.crop || "Crop Scan"}
                        </strong>
                        <span className="text-xs text-[#545850] block mb-2">
                          Diagnosis: <strong className={isHealthy ? "text-emerald-800" : "text-[#590907]"}>{scan.disease || "Healthy"}</strong>
                        </span>
                        <span className="text-[11px] text-[#A5A79B] block">
                          {scan.createdAt ? formattedDate(scan.createdAt) : "Recent"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F7EFE4] border-t border-[#A5A79B]/20 text-right">
                      <Link
                        to="/history"
                        className="text-xs font-semibold text-[#590907] hover:underline"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#A5A79B]/40 bg-[#F7EFE4]/50">
              <div className="w-12 h-12 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-3 text-2xl">
                <RiPlantLine />
              </div>
              <h3 className="text-sm font-bold text-[#1C1E1B] mb-1">No Crop Health Scans Recorded Yet</h3>
              <p className="text-xs text-[#545850] max-w-md mx-auto mb-4">
                Upload or capture an image of a leaf displaying discoloration, spots, or wilting. Ceres diagnoses over 38 crop disease classes with verified organic and chemical treatments.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <span>Run First Crop Scan</span>
                <RiArrowRightLine />
              </Link>
            </div>
          )}
        </div>

        {/* Ceres Agronomist Assistant Banner */}
        {/* Telegram Phone Bot Integration Section */}
        <div className="mb-8">
          <TelegramBotPanel />
        </div>

        {/* Agricultural AI Assistant Prompt Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FDFBF7] to-[#F7EFE4] border border-[#A5A79B]/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#590907] text-[#FDFBF7] flex items-center justify-center text-2xl shrink-0 shadow-sm">
              <RiSparklingLine />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1E1B]">Ceres Multilingual Agronomist Assistant</h3>
              <p className="text-xs text-[#545850]">
                Ask questions in English, Hindi (हिंदी), or Marathi (मराठी). Grounded in your active farm plot, soil profile, and recent scan diagnoses.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/assistant"
              className="px-4 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs hover:bg-[#420605] shadow transition whitespace-nowrap"
            >
              Open Full Assistant
            </Link>
            <button
              onClick={() => {
                const chatButton = document.querySelector(".farmer-chat__toggle");
                if (chatButton) chatButton.click();
              }}
              className="px-4 py-2 rounded-full border border-[#590907] text-[#590907] font-semibold text-xs hover:bg-[#590907]/10 transition whitespace-nowrap"
            >
              Quick Popup
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
