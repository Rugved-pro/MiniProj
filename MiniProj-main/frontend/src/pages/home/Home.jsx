import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import NavbarHome from "../../components/navbars/Navbar-home";
import Footer from "../../components/Footer";
import Spinner2 from "../../components/Spinner2";
import { useAuthContext } from "../../context/AuthContext";
import useGetMyHistory from "../../hooks/useGetMyHistory";
import { fetchIPInfo } from "../../utils/getLocationAndWeatherData";
import { getLiveCurrentWeather } from "../../utils/getTempAndHum";
import formattedDate from "../../utils/formattedDate";
import { RiPlantLine, RiShieldCheckLine, RiAlertLine, RiCameraLensLine } from "react-icons/ri";
import { MdOutlineSensors, MdOutlineStorefront, MdArrowForward, MdOutlineRefresh } from "react-icons/md";
import { WiDaySunny } from "react-icons/wi";
import "./Home.css";

const Home = () => {
  const { authUser } = useAuthContext();
  const { history } = useGetMyHistory();

  const [loading, setLoading] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  const [locationData, setLocationData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [refreshingWeather, setRefreshingWeather] = useState(false);

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

  const tempC = weatherData?.temperatureC ?? null;
  const humidity = weatherData?.humidity ?? null;
  const isFungalRiskElevated = humidity !== null && humidity >= 70 && tempC !== null && tempC >= 20 && tempC <= 29;

  return (
    <div className="home min-h-screen bg-[#F7EFE4] text-[#1C1E1B]">
      <NavbarHome />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#590907] mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#590907]"></span>
                <span>Active Field Intelligence Overview</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                Welcome back{authUser?.name ? `, ${authUser.name}` : ""}
              </h1>
              <p className="text-xs sm:text-sm text-[#545850] mt-1">
                {locationData?.city && (
                  <span>Field Region: <strong className="text-[#1C1E1B]">{locationData.city}</strong></span>
                )}
                {authUser?.crops && authUser.crops.length > 0 && (
                  <span>{locationData?.city ? " • " : ""}Registered Crops: <strong className="text-[#1C1E1B]">{authUser.crops.join(", ")}</strong></span>
                )}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <RiPlantLine className="text-base" />
                <span>Assess Crop Health</span>
              </Link>
              <Link
                to="/capture"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#590907] border border-[#590907]/30 font-semibold text-xs hover:border-[#590907] hover:bg-[#E8D2B5]/20 transition"
              >
                <RiCameraLensLine className="text-sm" />
                <span>Camera</span>
              </Link>
              <Link
                to="/soil-intelligence"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
              >
                <MdOutlineSensors className="text-sm" />
                <span>Soil Rules</span>
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
              >
                <MdOutlineStorefront className="text-sm" />
                <span>Marketplace</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Environmental Telemetry & Field Risk Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* Microclimate Card */}
          <div className="md:col-span-7 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#A5A79B]/25 mb-4">
              <div className="flex items-center gap-2">
                <WiDaySunny className="text-xl text-[#590907]" />
                <h2 className="text-sm font-bold text-[#1C1E1B]">Regional Microclimate Telemetry</h2>
              </div>
              <button
                onClick={refreshWeather}
                disabled={refreshingWeather}
                className="text-xs text-[#545850] hover:text-[#590907] flex items-center gap-1"
                title="Refresh Weather"
              >
                <MdOutlineRefresh className={`text-sm ${refreshingWeather ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25">
                <span className="text-[11px] text-[#545850] block">Temperature</span>
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
                <span className="text-[10px] text-[#A5A79B] block">Live · Open-Meteo</span>
              </div>
            </div>

            <div className="text-[11px] text-[#545850] flex items-center justify-between">
              <span>
                {weatherData?.time
                  ? `Open-Meteo · Updated ${weatherData.time}`
                  : "Live weather data unavailable"}
              </span>
              <Link to="/dashboard" className="text-[#590907] font-semibold hover:underline">
                Regional Analytics →
              </Link>
            </div>
          </div>

          {/* Explainable Field Risk Card */}
          <div className="md:col-span-5 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-[#A5A79B]/25 mb-4">
                <RiAlertLine className="text-base text-[#590907]" />
                <h2 className="text-sm font-bold text-[#1C1E1B]">Field-Risk Assessment</h2>
              </div>

              {!weatherData ? (
                <div className="p-3.5 rounded-lg bg-gray-50 border border-gray-200 mb-3">
                  <div className="flex items-start gap-2">
                    <RiAlertLine className="text-gray-500 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-gray-800 block">Live Field-Risk Assessment Unavailable</strong>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">
                        Current temperature and humidity readings could not be retrieved. Refresh to try again.
                      </p>
                    </div>
                  </div>
                </div>
              ) : isFungalRiskElevated ? (
                <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                  <div className="flex items-start gap-2">
                    <RiAlertLine className="text-amber-700 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-amber-900 block">Elevated Fungal Spore Risk</strong>
                      <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                        High ambient humidity ({humidity}%) and warm temperature ({tempC}°C) favor rust and blight germination. Inspect lower leaf surfaces.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 mb-3">
                  <div className="flex items-start gap-2">
                    <RiShieldCheckLine className="text-emerald-700 text-lg shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-emerald-900 block">Microclimate Fungal Risk Low</strong>
                      <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                        Current temperature and humidity readings are within standard vegetative tolerance ranges.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25 text-xs text-[#545850]">
                <strong className="text-[#1C1E1B] block mb-1">Recommended Field Action:</strong>
                Verify soil moisture depletion using FAO-56 rules before next irrigation cycle to prevent root waterlogging.
              </div>
            </div>

            <div className="pt-3 border-t border-[#A5A79B]/20 text-right">
              <Link to="/soil-intelligence" className="text-xs text-[#590907] font-semibold hover:underline">
                Open Soil Analyzer →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Crop Health Assessments Section */}
        <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#A5A79B]/25 mb-6">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#1C1E1B]">Recent Crop Assessments</h2>
              <p className="text-xs text-[#545850]">Verified diagnoses from your uploaded field imagery</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-[#590907] hover:underline flex items-center gap-1"
            >
              <span>View All History</span>
              <MdArrowForward className="text-sm" />
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
                          {scan.crop || "Unknown Crop"}
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
              <h3 className="text-sm font-bold text-[#1C1E1B] mb-1">No Crop Assessments Recorded Yet</h3>
              <p className="text-xs text-[#545850] max-w-md mx-auto mb-4">
                Upload or capture a photo of your crop leaf to run the Vision Transformer model and receive a detailed disease evaluation.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <span>Run First Crop Scan</span>
                <MdArrowForward />
              </Link>
            </div>
          )}
        </div>

        {/* Agricultural AI Assistant Prompt Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FDFBF7] to-[#F7EFE4] border border-[#A5A79B]/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#590907] text-[#FDFBF7] flex items-center justify-center text-2xl shrink-0">
              <RiShieldCheckLine />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1E1B]">Ceres Agricultural Assistant</h3>
              <p className="text-xs text-[#545850]">
                Need advice on irrigation scheduling or fungicide application? Ask our Gemini-powered assistant anytime using the widget below.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const chatButton = document.querySelector(".farmer-chat__toggle");
              if (chatButton) chatButton.click();
            }}
            className="px-4 py-2 rounded-full border border-[#590907] text-[#590907] font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition whitespace-nowrap"
          >
            Open Assistant
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
