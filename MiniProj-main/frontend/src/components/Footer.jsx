import { Link } from "react-router-dom";
import CeresLogo from "./CeresLogo";

const Footer = () => {
  return (
    <footer className="w-full bg-[#FDFBF7] border-t border-[#A5A79B]/30 pt-12 pb-8 px-6 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        <div className="md:col-span-2">
          <div className="mb-3">
            <CeresLogo size={32} />
          </div>
          <p className="text-sm text-[#545850] max-w-md leading-relaxed mb-4">
            Ceres is an agricultural intelligence platform that helps farmers understand crop health,
            environmental risk conditions, and potential harvest impact with evidence-based diagnostics.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8D2B5]/30 border border-[#A5A79B]/30 text-xs text-[#545850]">
            <span className="w-2 h-2 rounded-full bg-[#590907]"></span>
            <span>Evidence-based FAO-56 & ViT diagnostic standards</span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold tracking-wider uppercase text-[#590907] mb-3">Workflows</h4>
          <ul className="space-y-2 text-sm text-[#545850]">
            <li><Link to="/upload" className="hover:text-[#590907] transition-colors">Crop Disease Assessment</Link></li>
            <li><Link to="/capture" className="hover:text-[#590907] transition-colors">Real-time Camera Capture</Link></li>
            <li><Link to="/soil-intelligence" className="hover:text-[#590907] transition-colors">Soil & Irrigation Intelligence</Link></li>
            <li><Link to="/marketplace" className="hover:text-[#590907] transition-colors">Farmer & Agri Marketplace</Link></li>
            <li><Link to="/dashboard" className="hover:text-[#590907] transition-colors">Regional Weather & Risk Dashboard</Link></li>
            <li><Link to="/history" className="hover:text-[#590907] transition-colors">Assessment History & Records</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold tracking-wider uppercase text-[#590907] mb-3">Integrations</h4>
          <ul className="space-y-2 text-sm text-[#545850]">
            <li><span>Vision Transformer (ViT)</span></li>
            <li><span>FAO-56 Soil Moisture Rules</span></li>
            <li><span>Open-Meteo Microclimate Data</span></li>
            <li><span>Gemini Farmer Assistant</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-[#A5A79B]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#545850]">
        <p>© 2026 Ceres Field Intelligence. Developed for smart agricultural resilience.</p>
        <p className="text-center sm:text-right">
          Recommendations are decision-support baselines. Always consult local agricultural extension officers for regulated chemical treatments.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
