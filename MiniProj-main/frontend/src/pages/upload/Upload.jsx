import { useState, useRef } from "react";
import { MdCloudUpload, MdDelete } from "react-icons/md";
import { RiPlantLine, RiImageAddLine, RiCheckLine, RiRefreshLine } from "react-icons/ri";
import { uploadBlobToCloudinary } from "../../utils/uploadBlobToCloudinary.js";
import useGetPredictions from "../../hooks/useGetPredictions.js";
import Predictions from "../../components/Predictions.jsx";
import Spinner from "../../components/Spinner.jsx";
import Navbar from "../../components/navbars/Navbar-actions.jsx";
import Footer from "../../components/Footer.jsx";
import toast from "react-hot-toast";

const Uploader = () => {
  const inputRef = useRef(null);
  const [uiState, setUIState] = useState("capture");
  const [images, setImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [predictedData, setPredictedData] = useState(null);
  const { getPredictions } = useGetPredictions();

  const handleImageUpload = () => {
    inputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (images.length >= 3) {
        toast.error("You can upload a maximum of 3 images for sharpness comparison.");
        return;
      }
      const img = URL.createObjectURL(file);
      setImages((prev) => [...prev, img]);
    }
  };

  const handleRunAssessment = async () => {
    if (images.length === 0) {
      toast.error("Please select at least one leaf photo.");
      return;
    }

    setAnalyzing(true);
    setUIState("loading");

    try {
      // 1. Upload blobs (to local backend endpoint or Cloudinary fallback)
      const uploadPromises = images.map(async (imageBlob) => {
        return await uploadBlobToCloudinary(imageBlob);
      });
      const resolvedUrls = await Promise.all(uploadPromises);
      setUploadData(resolvedUrls);

      // 2. Run prediction pipeline
      const predictions = await getPredictions(resolvedUrls);
      setPredictedData(predictions);
      setUIState("result");
    } catch (error) {
      console.error("Assessment error:", error);
      toast.error(error.message || "Failed to complete crop assessment. Please try again.");
      setUIState("capture");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeletion = (imageToDelete) => {
    setImages((prev) => prev.filter((img) => img !== imageToDelete));
  };

  const resetToCapture = () => {
    setImages([]);
    setUploadData([]);
    setPredictedData(null);
    setUIState("capture");
  };

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-4xl mx-auto px-6 py-10">
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-2">
              Diagnostic Workflow
            </span>
            <h1 className="text-3xl font-bold font-serif text-[#1C1E1B] mb-2">
              Crop Health Assessment
            </h1>
            <p className="text-xs sm:text-sm text-[#545850]">
              Submit 1 to 3 clear leaf photographs. Ceres automatically selects the sharpest frame to diagnose fungal, bacterial, or physiological issues.
            </p>
          </div>

          {uiState === "capture" && (
            <div className="space-y-6">
              {/* Guidance Banner */}
              <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/35 shadow-sm text-xs text-[#545850] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#590907]"></span>
                  <span><strong>Optimal capture advice:</strong> Natural daylight, single flat leaf, focus sharply on spots/lesions.</span>
                </div>
                <span className="font-mono text-[11px] text-[#A5A79B]">{images.length}/3 images selected</span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={handleImageUpload}
                className="w-full bg-[#FDFBF7] border-2 border-dashed border-[#A5A79B]/60 hover:border-[#590907] rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 shadow-sm"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#E8D2B5]/30 flex items-center justify-center text-[#590907] text-3xl mb-4">
                  <MdCloudUpload />
                </div>
                <strong className="text-base font-semibold text-[#1C1E1B] mb-1">
                  Click to select crop leaf photos
                </strong>
                <span className="text-xs text-[#545850] mb-4 text-center max-w-xs">
                  Supports JPG, PNG, or WEBP. Upload up to 3 angles for automatic Laplacian sharpness selection.
                </span>

                <button
                  type="button"
                  className="px-4 py-2 rounded-full border border-[#590907]/40 text-[#590907] text-xs font-semibold hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                >
                  <span className="flex items-center gap-1.5">
                    <RiImageAddLine className="text-sm" />
                    <span>Browse Files</span>
                  </span>
                </button>

                <input
                  type="file"
                  accept="image/*"
                  ref={inputRef}
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#545850] mb-4">
                    Selected Images ({images.length} of 3)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="relative h-44 rounded-xl overflow-hidden border border-[#A5A79B]/40 group"
                      >
                        <img
                          src={imgSrc}
                          alt={`Uploaded frame ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-[#1C1E1B]/80 text-[#FDFBF7] text-[10px] font-mono px-2 py-0.5 rounded">
                          Angle #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletion(imgSrc);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#590907] text-[#FDFBF7] flex items-center justify-center hover:bg-[#420605] shadow transition"
                          title="Remove image"
                        >
                          <MdDelete className="text-base" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-5 border-t border-[#A5A79B]/25 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={resetToCapture}
                      className="text-xs text-[#545850] hover:text-[#590907] flex items-center gap-1"
                    >
                      <RiRefreshLine className="text-sm" />
                      <span>Clear All</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRunAssessment}
                      disabled={analyzing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-sm shadow hover:bg-[#420605] transition disabled:opacity-50"
                    >
                      {analyzing ? <Spinner /> : <RiCheckLine className="text-base" />}
                      <span>Run Diagnostic Assessment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {uiState === "loading" && (
            <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-4 text-3xl animate-pulse">
                <RiPlantLine />
              </div>
              <h3 className="text-lg font-bold font-serif text-[#1C1E1B] mb-1">
                Analyzing Foliage Pathology
              </h3>
              <p className="text-xs text-[#545850] max-w-sm mx-auto mb-6">
                Filtering frame sharpness and computing Vision Transformer class probabilities...
              </p>
              <div className="max-w-xs mx-auto">
                <Spinner />
              </div>
            </div>
          )}

          {uiState === "result" && predictedData && (
            <div className="flex flex-col items-center gap-6">
              {/* Analyzed Image Banner */}
              {uploadData.length > 0 && (
                <div className="w-full max-w-2xl bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={predictedData.url || uploadData[0]}
                      alt="Evaluated frame"
                      className="w-16 h-16 rounded-lg object-cover border border-[#A5A79B]/40"
                    />
                    <div>
                      <strong className="text-xs font-bold text-[#1C1E1B] block">Selected Primary Focal Frame</strong>
                      <span className="text-[11px] text-[#545850]">Filtered via Laplacian Variance Sharpness</span>
                    </div>
                  </div>
                  <button
                    onClick={resetToCapture}
                    className="px-4 py-2 rounded-full border border-[#590907] text-[#590907] font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                  >
                    Assess Another Leaf
                  </button>
                </div>
              )}

              {/* Assessment Card */}
              <Predictions data={predictedData} />
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Uploader;
