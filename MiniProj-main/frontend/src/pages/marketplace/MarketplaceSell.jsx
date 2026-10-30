import { useCallback, useRef, useState } from "react";
import "./market.css";
import Webcam from "react-webcam";
import { uploadBlobToCloudinary } from "../../utils/uploadBlobToCloudinary";
import { base64ToBlob } from "../../utils/base64ToBlob";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner";
import useSellProduct from "../../hooks/useSellProduct";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { Link, useNavigate } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { RiCameraLensLine, RiImageAddLine, RiRefreshLine, RiUploadCloud2Line } from "react-icons/ri";
import { MdOutlineStorefront } from "react-icons/md";

const videoConstraints = {
  width: 450,
  height: 450,
  facingMode: "environment",
};

const MarketplaceSell = () => {
  const [inputs, setInputs] = useState({
    product_name: "",
    image_url: "",
    seller_name: "",
    seller_type: "farmer",
    price: "",
  });
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [url, setUrl] = useState(null);
  const [uploadData, setUploadData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { loading, sell } = useSellProduct();
  const navigate = useNavigate();

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imgSrc = webcamRef.current.getScreenshot();
      if (imgSrc) {
        const blob = base64ToBlob(imgSrc, "image/png");
        const blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
      }
    }
  }, [webcamRef]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      setUrl(blobUrl);
    }
  };

  const handleUploadToCloudinary = async () => {
    setUploading(true);
    try {
      const glbUrl = await uploadBlobToCloudinary(url);
      setUploadData(glbUrl);
      setInputs((prev) => ({ ...prev, image_url: glbUrl }));
      toast.success("Product photo uploaded!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalInputs = { ...inputs };
    if (!finalInputs.image_url && url) {
      const uploadedUrl = await uploadBlobToCloudinary(url);
      finalInputs.image_url = uploadedUrl;
    }
    if (!finalInputs.image_url) {
      finalInputs.image_url =
        "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80";
    }
    await sell(finalInputs);
    navigate("/marketplace/my-listings");
  };

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-6">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545850] hover:text-[#590907] transition"
            >
              <IoMdArrowRoundBack className="text-sm" />
              <span>Back to Marketplace</span>
            </Link>
          </div>

          <div className="pb-6 border-b border-[#A5A79B]/30 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
              Direct Farm &amp; Retail Listing
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
              List Your Produce or Agri Input
            </h1>
            <p className="text-xs sm:text-sm text-[#545850] mt-0.5">
              Capture or upload a clear photo of your crop, seed, or equipment and set your unit price.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Camera / File Upload */}
            <div className="lg:col-span-6 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1C1E1B] pb-3 border-b border-[#A5A79B]/25 mb-4">
                  Product Photograph
                </h2>

                <div className="rounded-xl overflow-hidden bg-[#F7EFE4] border border-dashed border-[#A5A79B]/60 flex items-center justify-center min-h-[300px] p-3">
                  {url ? (
                    <img
                      src={url}
                      alt="Product preview"
                      className="max-h-[340px] w-full object-contain rounded-lg"
                    />
                  ) : (
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/png"
                      videoConstraints={videoConstraints}
                      mirrored={false}
                      screenshotQuality={1}
                      className="w-full max-h-[340px] object-cover rounded-lg"
                    />
                  )}
                </div>
              </div>

              <div className="mt-5">
                {!url ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
                    >
                      <RiCameraLensLine className="text-sm" />
                      <span>Capture Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#FDFBF7] text-[#590907] border border-[#590907]/40 font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                    >
                      <RiImageAddLine className="text-sm" />
                      <span>Choose File</span>
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setUrl(null);
                        setUploadData(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#FDFBF7] text-[#545850] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
                    >
                      <RiRefreshLine className="text-sm" />
                      <span>Retake / Change</span>
                    </button>
                    {!uploadData && (
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={handleUploadToCloudinary}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition disabled:opacity-50"
                      >
                        {uploading ? (
                          <Spinner />
                        ) : (
                          <>
                            <RiUploadCloud2Line className="text-sm" />
                            <span>Save Image</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Product Details Form */}
            <div className="lg:col-span-6 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#A5A79B]/25 mb-6">
                <MdOutlineStorefront className="text-lg text-[#590907]" />
                <h2 className="text-sm font-bold text-[#1C1E1B]">Listing Specifications</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="product_name"
                    className="block text-xs font-bold uppercase tracking-wider text-[#545850] mb-1.5"
                  >
                    Crop or Product Name
                  </label>
                  <input
                    id="product_name"
                    type="text"
                    required
                    placeholder="e.g., Organic Sharbati Wheat, NPK Fertilizer, Drip Kit"
                    value={inputs.product_name}
                    onChange={(e) => setInputs({ ...inputs, product_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/45 text-sm text-[#1C1E1B] placeholder-[#A5A79B] focus:outline-none focus:border-[#590907] transition"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#545850] mb-2">
                    Seller Category
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "farmer", label: "Farmer / Producer" },
                      { value: "retailer", label: "Agri Retailer" },
                    ].map((option) => {
                      const active = inputs.seller_type === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setInputs({ ...inputs, seller_type: option.value })}
                          className={`py-2.5 px-4 rounded-xl text-xs font-semibold border transition ${
                            active
                              ? "bg-[#590907] text-[#FDFBF7] border-[#590907] shadow-sm"
                              : "bg-[#F7EFE4] text-[#545850] border-[#A5A79B]/40 hover:border-[#590907]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="seller_name"
                    className="block text-xs font-bold uppercase tracking-wider text-[#545850] mb-1.5"
                  >
                    {inputs.seller_type === "retailer"
                      ? "Enterprise / Retailer Name"
                      : "Farmer Name"}
                  </label>
                  <input
                    id="seller_name"
                    type="text"
                    required
                    placeholder={
                      inputs.seller_type === "retailer"
                        ? "Enter your enterprise or store name"
                        : "Enter your full name"
                    }
                    value={inputs.seller_name}
                    onChange={(e) => setInputs({ ...inputs, seller_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/45 text-sm text-[#1C1E1B] placeholder-[#A5A79B] focus:outline-none focus:border-[#590907] transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="block text-xs font-bold uppercase tracking-wider text-[#545850] mb-1.5"
                  >
                    Price per kg / unit (₹)
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="1"
                    required
                    placeholder="Enter price in INR (₹)"
                    value={inputs.price}
                    onChange={(e) => setInputs({ ...inputs, price: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/45 text-sm text-[#1C1E1B] placeholder-[#A5A79B] focus:outline-none focus:border-[#590907] transition"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-sm shadow hover:bg-[#420605] transition disabled:opacity-50"
                  >
                    {loading ? <Spinner /> : "Publish Marketplace Listing"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MarketplaceSell;
