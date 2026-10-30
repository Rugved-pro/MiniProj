import PropTypes from "prop-types";
import formattedDate from "../utils/formattedDate";
import { RiPlantLine, RiShieldCheckLine, RiAlertLine } from "react-icons/ri";

const HistoryCard = ({ history }) => {
  const date = formattedDate(history.createdAt);
  const isHealthy = !history.disease || history.disease.toLowerCase() === "healthy";

  return (
    <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 shadow-sm rounded-xl overflow-hidden hover:border-[#590907]/40 transition duration-150 flex flex-col justify-between">
      <div>
        <div className="relative h-44 w-full bg-[#E8D2B5]/30 overflow-hidden">
          {history.url ? (
            <img
              src={history.url}
              alt={history.crop || "Crop Leaf"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A5A79B]">
              <RiPlantLine className="text-3xl" />
            </div>
          )}
          <span
            className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
              isHealthy
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-rose-100 text-[#590907] border border-rose-300"
            }`}
          >
            {isHealthy ? "Optimal Health" : "Affected"}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-[#545850] mb-1">
            <span className="font-semibold text-[#1C1E1B]">{history.crop || "Unknown Crop"}</span>
            <span>•</span>
            <span>{history.location || "Field Plot"}</span>
          </div>

          <h3 className="text-base font-bold font-serif text-[#1C1E1B] mb-2">
            {isHealthy ? "Healthy Leaf Canopy" : history.disease}
          </h3>

          <span className="text-[11px] font-mono text-[#A5A79B] block mb-3">
            Assessed on {date}
          </span>

          <div className="p-2.5 rounded-lg bg-[#F7EFE4] border border-[#A5A79B]/25 text-xs text-[#545850] mb-3">
            <strong className="text-[#1C1E1B] block mb-0.5">Management Protocol:</strong>
            {history.recomm && history.recomm.length > 0 ? (
              <p className="line-clamp-2">{history.recomm[0]}</p>
            ) : isHealthy ? (
              <p className="text-emerald-900 flex items-center gap-1">
                <RiShieldCheckLine className="text-sm shrink-0" />
                <span>Crop is thriving. Maintain normal watering schedule.</span>
              </p>
            ) : (
              <p>Follow standard biological or chemical mitigation steps.</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#F7EFE4] border-t border-[#A5A79B]/20 flex items-center justify-between text-xs">
        <span className="text-[#545850]">Verified Record</span>
        <span className="font-semibold text-[#590907]">ViT Evaluated</span>
      </div>
    </div>
  );
};

HistoryCard.propTypes = {
  history: PropTypes.shape({
    createdAt: PropTypes.string,
    url: PropTypes.string,
    crop: PropTypes.string,
    location: PropTypes.string,
    disease: PropTypes.string,
    recomm: PropTypes.array,
  }),
};

export default HistoryCard;
