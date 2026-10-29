import { useAuthContext } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import useLogout from "../hooks/useLogout";
import Translate from "./TranslateComponent.jsx";
import { RiPlantLine, RiShieldCheckLine } from "react-icons/ri";
import { MdOutlineSensors, MdArrowForward } from "react-icons/md";
import { WiDaySunny } from "react-icons/wi";

const Layout = () => {
  const { authUser } = useAuthContext();
  const { loading, logout } = useLogout();
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-12 lg:py-16">
      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8D2B5]/40 border border-[#A5A79B]/40 text-xs font-semibold text-[#590907] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#590907]"></span>
            <span>Intelligent Agricultural Decision Support</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-[#1C1E1B] leading-tight mb-5">
            Field Health Intelligence for Resilient Agriculture
          </h1>

          <p className="text-base sm:text-lg text-[#545850] leading-relaxed max-w-xl mb-8">
            Ceres delivers computer-vision crop disease detection, soil moisture telemetry evaluation,
            and proactive microclimate risk alerts — helping farmers protect crop yields before outbreaks spread.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link
              to={authUser ? "/upload" : "/login"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-sm shadow-md hover:bg-[#420605] hover:shadow-lg transition-all duration-150"
            >
              <span>Start Crop Assessment</span>
              <MdArrowForward className="text-base" />
            </Link>

            <Link
              to={authUser ? "/soil-intelligence" : "/login"}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#FDFBF7] text-[#590907] border border-[#590907]/30 font-semibold text-sm hover:border-[#590907] hover:bg-[#E8D2B5]/20 transition-all duration-150"
            >
              <span>Soil & Irrigation Rules</span>
            </Link>

            {authUser ? (
              <button
                onClick={logout}
                className="px-4 py-2 text-xs font-medium text-[#545850] hover:text-[#590907] underline underline-offset-4"
              >
                {loading ? "Signing out..." : "Sign Out"}
              </button>
            ) : null}
          </div>

          {!authUser && (
            <div className="pt-4 border-t border-[#A5A79B]/25 w-full max-w-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#545850]">
                <span>Language:</span>
                <Translate />
              </div>
              <div className="text-xs text-[#545850]">
                Already registered?{" "}
                <Link to="/login" className="font-semibold text-[#590907] hover:underline">
                  Sign in here
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Restrained Agricultural Intelligence Mockup Card */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#A5A79B]/25 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-700"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C1E1B]">Field Monitor: Plot 01</span>
              </div>
              <span className="text-[11px] font-mono text-[#545850] bg-[#E8D2B5]/40 px-2 py-0.5 rounded">
                Live Analysis
              </span>
            </div>

            {/* Diagnostic Metrics Snapshot */}
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 flex items-start justify-between">
                <div>
                  <span className="text-xs text-[#545850] block mb-0.5">Primary Crop</span>
                  <strong className="text-sm font-semibold text-[#1C1E1B]">Wheat (Triticum aestivum)</strong>
                  <span className="text-xs text-[#545850] block mt-0.5">Stage: Mid-season vegetative</span>
                </div>
                <RiPlantLine className="text-2xl text-[#590907]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                  <div className="flex items-center gap-1.5 text-xs text-[#545850] mb-1">
                    <MdOutlineSensors className="text-sm text-[#590907]" />
                    <span>Soil Moisture</span>
                  </div>
                  <div className="text-lg font-bold text-[#1C1E1B]">31.2% <span className="text-xs font-normal text-[#545850]">vol</span></div>
                  <span className="text-[11px] font-medium text-emerald-800">Above wilting point</span>
                </div>

                <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                  <div className="flex items-center gap-1.5 text-xs text-[#545850] mb-1">
                    <WiDaySunny className="text-base text-[#590907]" />
                    <span>Microclimate</span>
                  </div>
                  <div className="text-lg font-bold text-[#1C1E1B]">24.8°C <span className="text-xs font-normal text-[#545850]">/ 64%</span></div>
                  <span className="text-[11px] font-medium text-emerald-800">Fungal risk low</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <RiShieldCheckLine className="text-xl text-emerald-700 shrink-0" />
                  <div>
                    <strong className="text-xs font-semibold text-emerald-900 block">ViT Canopy Scan: Healthy</strong>
                    <span className="text-[11px] text-emerald-700">No symptomatic lesions detected</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 font-mono">94.8% conf</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#A5A79B]/20 flex items-center justify-between text-xs text-[#545850]">
              <span>Assessed via Vision Transformer</span>
              <button
                onClick={() => navigate(authUser ? "/upload" : "/login")}
                className="text-[#590907] font-semibold hover:underline"
              >
                Scan your crop →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workflows Section */}
      <div className="mt-20 pt-12 border-t border-[#A5A79B]/30">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B] mb-3">
            Core Agricultural Intelligence Workflows
          </h2>
          <p className="text-sm sm:text-base text-[#545850]">
            Grounding computer vision and environmental science to support farm management decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-6 hover:border-[#590907]/50 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl mb-4">
              <RiPlantLine />
            </div>
            <h3 className="text-base font-bold text-[#1C1E1B] mb-2">1. Disease Identification</h3>
            <p className="text-xs sm:text-sm text-[#545850] leading-relaxed">
              Upload leaf imagery to run multi-class Vision Transformer inference with multi-angle sharpness selection and explicit uncertainty boundaries.
            </p>
          </div>

          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-6 hover:border-[#590907]/50 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl mb-4">
              <MdOutlineSensors />
            </div>
            <h3 className="text-base font-bold text-[#1C1E1B] mb-2">2. Soil & Moisture Analytics</h3>
            <p className="text-xs sm:text-sm text-[#545850] leading-relaxed">
              Analyze soil moisture against FAO-56 depletion rules for wheat, potato, and maize. Identify crop water stress without black-box estimation.
            </p>
          </div>

          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-6 hover:border-[#590907]/50 transition-all duration-200">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl mb-4">
              <RiShieldCheckLine />
            </div>
            <h3 className="text-base font-bold text-[#1C1E1B] mb-2">3. Contextual AI Guidance</h3>
            <p className="text-xs sm:text-sm text-[#545850] leading-relaxed">
              Engage with our Gemini-powered agricultural assistant grounded in your crop type, diagnosis, weather conditions, and regional KVK guidelines.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
