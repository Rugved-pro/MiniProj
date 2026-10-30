import PropTypes from "prop-types";
import { RiShieldCheckLine, RiAlertLine, RiPlantLine, RiMedicineBottleLine, RiQuestionAnswerLine } from "react-icons/ri";

const Predictions = ({ data }) => {
  if (!data) return null;

  const isHealthy = !data.disease || data.disease.toLowerCase() === "healthy";

  const handleOpenAssistant = () => {
    const chatBtn = document.querySelector(".farmer-chat__toggle");
    if (chatBtn) chatBtn.click();
  };

  return (
    <div className="w-full max-w-2xl bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 shadow-sm text-left">
      {/* Diagnosis Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#A5A79B]/25 gap-3 mb-6">
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#545850] block mb-1">
            Diagnostic Assessment Result
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold font-serif text-[#1C1E1B]">
              {data.crop || "Identified Crop"}
            </span>
            <span className="text-sm text-[#545850]">
              • {isHealthy ? "Healthy Foliage" : data.disease}
            </span>
          </div>
        </div>

        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto ${
            isHealthy
              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
              : "bg-rose-100 text-[#590907] border border-rose-300"
          }`}
        >
          {isHealthy ? (
            <>
              <RiShieldCheckLine className="text-base" />
              <span>Optimal Health</span>
            </>
          ) : (
            <>
              <RiAlertLine className="text-base" />
              <span>Pathogen Identified</span>
            </>
          )}
        </div>
      </div>

      {/* Disease Details & Symptoms */}
      <div className="mb-6">
        <h4 className="text-xs font-bold tracking-wider uppercase text-[#590907] mb-2 flex items-center gap-1.5">
          <RiPlantLine className="text-base" />
          <span>Symptomatic Observations</span>
        </h4>
        <div className="p-4 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 text-xs sm:text-sm text-[#1C1E1B] leading-relaxed">
          {data.disease_details && data.disease_details.length > 0 ? (
            <p>{data.disease_details.join(" ")}</p>
          ) : isHealthy ? (
            <p className="text-emerald-900">
              No symptomatic chlorosis, necrotic lesions, or fungal sporulation detected across the sampled leaf canopy. Plant tissue exhibits normal vigor.
            </p>
          ) : (
            <p>Visual symptoms match {data.disease}. Monitor surrounding field plots for progressive foliage spots.</p>
          )}
        </div>
      </div>

      {/* Recommended Agricultural Actions */}
      <div className="mb-6">
        <h4 className="text-xs font-bold tracking-wider uppercase text-[#590907] mb-2">
          Cultural & Preventative Management
        </h4>
        {data.recomm && data.recomm.length > 0 ? (
          <ul className="space-y-2 text-xs sm:text-sm text-[#545850]">
            {data.recomm.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#590907] shrink-0 mt-1.5"></span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#545850]">
            Maintain balanced irrigation according to crop stage. No immediate corrective cultural practices required.
          </p>
        )}
      </div>

      {/* Regulated Remediation & Pesticides */}
      <div className="mb-6">
        <h4 className="text-xs font-bold tracking-wider uppercase text-[#590907] mb-2 flex items-center gap-1.5">
          <RiMedicineBottleLine className="text-base" />
          <span>Recommended Remediation Treatments</span>
        </h4>
        {data.pesticides && data.pesticides.length > 0 ? (
          <div className="space-y-2">
            <ul className="space-y-1.5 text-xs sm:text-sm text-[#545850]">
              {data.pesticides.map((pest, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A5A79B] shrink-0 mt-1.5"></span>
                  <strong className="text-[#1C1E1B]">{pest}</strong>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-[#A5A79B] italic mt-2">
              Note: Always confirm active ingredients, application timing, and withholding periods against official manufacturer labels and local KVK advisory.
            </p>
          </div>
        ) : (
          <p className="text-xs text-[#545850]">
            No chemical intervention needed. Avoid unnecessary prophylactic fungicide applications to preserve beneficial soil microbiomes.
          </p>
        )}
      </div>

      {/* Model & Uncertainty Note */}
      <div className="p-3 rounded-lg bg-[#E8D2B5]/30 border border-[#A5A79B]/30 flex items-center justify-between text-xs text-[#545850] mb-6">
        <span>Assessed via Vision Transformer • Laplacian sharpness filtered</span>
        <button
          onClick={handleOpenAssistant}
          className="text-[#590907] font-semibold hover:underline flex items-center gap-1"
        >
          <RiQuestionAnswerLine className="text-sm" />
          <span>Ask Ceres Assistant</span>
        </button>
      </div>
    </div>
  );
};

Predictions.propTypes = {
  data: PropTypes.shape({
    crop: PropTypes.string,
    disease: PropTypes.string,
    disease_details: PropTypes.array,
    recomm: PropTypes.array,
    pesticides: PropTypes.array,
  }),
};

export default Predictions;
