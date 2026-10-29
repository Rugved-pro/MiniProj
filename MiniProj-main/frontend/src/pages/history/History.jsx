import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import useGetMyHistory from "../../hooks/useGetMyHistory";
import HistoryCard from "../../components/HistoryCard";
import Spinner2 from "../../components/Spinner2";
import { Link } from "react-router-dom";
import { RiPlantLine, RiHistoryLine } from "react-icons/ri";

const History = () => {
  const { loading, history } = useGetMyHistory();
  const [historyData, setHistoryData] = useState([]);
  const [filterCrop, setFilterCrop] = useState("all");

  const getHistory = async () => {
    try {
      const data = await history();
      if (Array.isArray(data)) {
        setHistoryData(data);
      }
    } catch (error) {
      console.error("Failed to fetch history data:", error);
    }
  };

  useEffect(() => {
    getHistory();
  }, []);

  const crops = ["all", ...new Set(historyData.map((h) => h.crop).filter(Boolean))];

  const filteredHistory = filterCrop === "all"
    ? historyData
    : historyData.filter((h) => h.crop === filterCrop);

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#A5A79B]/30 gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                Foliage Observations Log
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                Field Health Assessment History
              </h1>
              <p className="text-xs text-[#545850] mt-0.5">
                Archived diagnosis records and historical treatment recommendations
              </p>
            </div>

            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition self-start sm:self-auto"
            >
              <RiPlantLine className="text-sm" />
              <span>New Assessment</span>
            </Link>
          </div>

          {/* Crop Filter Bar */}
          {crops.length > 2 && (
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <span className="text-xs text-[#545850] font-semibold">Filter Crop:</span>
              {crops.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCrop(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition ${
                    filterCrop === c
                      ? "bg-[#590907] text-[#FDFBF7]"
                      : "bg-[#FDFBF7] text-[#545850] border border-[#A5A79B]/40 hover:border-[#590907]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-20 flex justify-center">
              <Spinner2 />
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...filteredHistory].reverse().map((record, idx) => (
                <HistoryCard key={record._id || idx} history={record} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-3 text-2xl">
                <RiHistoryLine />
              </div>
              <h3 className="text-base font-bold font-serif text-[#1C1E1B] mb-1">
                No Assessment Records Found
              </h3>
              <p className="text-xs text-[#545850] max-w-sm mx-auto mb-5">
                Past crop scans and disease diagnosis reports will automatically be logged here for monitoring disease progression over time.
              </p>
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <span>Upload Leaf Image</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default History;
