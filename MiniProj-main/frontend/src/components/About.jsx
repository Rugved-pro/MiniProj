import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Link } from "react-router-dom";
import { RiScan2Line, RiLeafLine, RiDatabase2Line } from "react-icons/ri";

const About = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-16" id="about-section-container" data-aos="fade-up">
      <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-8 sm:p-12 shadow-sm">
        <div className="max-w-2xl mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-2">
            Platform Mission
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-[#1C1E1B] leading-tight mb-4">
            Evidence-Based Crop Health for Sustainable Farming
          </h2>
          <p className="text-[#545850] text-sm sm:text-base leading-relaxed">
            Ceres bridges academic agronomy, field computer vision, and real-time microclimate sensors.
            We replace guesswork with calibrated uncertainty boundaries, transparent depletion calculations,
            and verified agricultural guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#A5A79B]/25">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl shrink-0 mt-0.5">
              <RiScan2Line />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1E1B] mb-1">Sharpness-Filtered ViT</h3>
              <p className="text-xs text-[#545850] leading-relaxed">
                Images are filtered using Laplacian sharpness scoring, feeding the highest quality frame into the Vision Transformer for consistent feature extraction.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl shrink-0 mt-0.5">
              <RiLeafLine />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1E1B] mb-1">FAO-56 Water Management</h3>
              <p className="text-xs text-[#545850] leading-relaxed">
                Soil moisture is evaluated against published FAO-56 depletion baselines for wheat, potato, and maize to alert farmers before yield-reducing stress occurs.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-[#590907]/10 flex items-center justify-center text-[#590907] text-xl shrink-0 mt-0.5">
              <RiDatabase2Line />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1C1E1B] mb-1">Calibrated Guidance</h3>
              <p className="text-xs text-[#545850] leading-relaxed">
                Treatment recommendations strictly follow approved biological and chemical baselines without inventing pesticide dosages or unproven cures.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#A5A79B]/20 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs text-[#545850]">
            Ready to assess your field? Free and open for all farmers.
          </span>
          <Link
            to="/upload"
            className="text-xs font-bold text-[#590907] hover:underline inline-flex items-center gap-1"
          >
            Go to Crop Assessment →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
