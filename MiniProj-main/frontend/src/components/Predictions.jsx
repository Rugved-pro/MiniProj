import PropTypes from "prop-types";
import {
  RiShieldCheckLine,
  RiAlertLine,
  RiPlantLine,
  RiMedicineBottleLine,
  RiQuestionAnswerLine,
  RiFocus2Line,
  RiBarChart2Line
} from "react-icons/ri";

const Predictions = ({ data }) => {
  if (!data) return null;

  const isHealthy = !data.disease || data.disease.toLowerCase() === "healthy";
  const confidence = typeof data.confidence === "number" ? data.confidence : null;
  const isUncertain = Boolean(data.is_uncertain) || (confidence !== null && confidence < 45);

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

      {/* Model Confidence & Quality Assessment Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="p-3.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiBarChart2Line className="text-lg text-[#590907]" />
            <div>
              <span className="text-[11px] text-[#545850] block">Model Confidence</span>
              <strong className="text-sm text-[#1C1E1B]">
                {confidence !== null ? `${confidence}%` : "Empirical Match"}
              </strong>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              confidence >= 75
                ? "bg-emerald-100 text-emerald-800"
                : confidence >= 45
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
            }`}
          >
            {confidence >= 75 ? "High Certainty" : confidence >= 45 ? "Moderate" : "Low Certainty"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiFocus2Line className="text-lg text-[#590907]" />
            <div>
              <span className="text-[11px] text-[#545850] block">Frame Sharpness</span>
              <strong className="text-sm text-[#1C1E1B]">
                {data.sharpness ? `${data.sharpness} variance` : "Clear frame selected"}
              </strong>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-[#545850]">
            {data.quality_warning ? "Soft Focus" : "Sharp Focus"}
          </span>
        </div>
      </div>

      {/* Uncertainty Notice if confidence is low */}
      {isUncertain && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 mb-6 flex items-start gap-2.5">
          <RiAlertLine className="text-lg text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Model Uncertainty Notice</strong>
            <span>
              The visual symptoms on this leaf closely match multiple physiological or fungal conditions ({confidence}% confidence). Do not apply chemical treatments without consulting a local agricultural extension officer (KVK).
            </span>
          </div>
        </div>
      )}

      {/* Top Alternative Diagnoses if available */}
      {Array.isArray(data.top3) && data.top3.length > 1 && (
        <div className="mb-6">
          <h4 className="text-xs font-bold tracking-wider uppercase text-[#545850] mb-2">
            Top Alternative Possibilities Evaluated
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {data.top3.map((cand, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs ${
                  idx === 0
                    ? "bg-[#590907]/5 border-[#590907]/40 font-semibold text-[#590907]"
                    : "bg-white border-[#A5A79B]/25 text-[#545850]"
                }`}
              >
                <div className="flex justify-between items-center mb-0.5">
                  <span className="truncate">{cand.crop}</span>
                  <span className="font-bold">{cand.confidence}%</span>
                </div>
                <span className="text-[11px] block truncate">{cand.disease}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {data.pesticides.map((pest, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/30 text-xs sm:text-sm text-[#1C1E1B]"
              >
                {pest}
              </div>
            ))}
          </div>
        ) : isHealthy ? (
          <p className="text-xs text-[#545850]">No fungicide, bactericide, or pesticide intervention needed.</p>
        ) : (
          <p className="text-xs text-[#545850]">Consult local agricultural extension (KVK) for certified formulations.</p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-[#A5A79B]/25 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] text-[#A5A79B]">
          Model: Vision Transformer (ViT-B/16) · Diagnostic indicator only
        </span>
        <button
          type="button"
          onClick={handleOpenAssistant}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#590907] text-[#590907] font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition"
        >
          <RiQuestionAnswerLine />
          <span>Ask Ceres Assistant About This Diagnosis</span>
        </button>
      </div>
    </div>
  );
};

Predictions.propTypes = {
  data: PropTypes.shape({
    crop: PropTypes.string,
    disease: PropTypes.string,
    confidence: PropTypes.number,
    top3: PropTypes.arrayOf(
      PropTypes.shape({
        crop: PropTypes.string,
        disease: PropTypes.string,
        confidence: PropTypes.number,
      })
    ),
    is_uncertain: PropTypes.bool,
    sharpness: PropTypes.number,
    quality_warning: PropTypes.string,
    disease_details: PropTypes.arrayOf(PropTypes.string),
    recomm: PropTypes.arrayOf(PropTypes.string),
    pesticides: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default Predictions;
