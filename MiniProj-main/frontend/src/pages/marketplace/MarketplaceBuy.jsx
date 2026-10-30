import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import useGetItemById from "../../hooks/useGetItemById";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import useHandlePay from "../../hooks/useHandlePay";
import Spinner from "../../components/Spinner";
import Spinner2 from "../../components/Spinner2";
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdOutlineStorefront, MdOutlineVerifiedUser, MdOutlineShoppingBag } from "react-icons/md";

const MarketplaceBuy = () => {
  const [prodInfo, setProdInfo] = useState(null);
  const { payLoading, handlePay } = useHandlePay();
  const { id } = useParams();
  const { loading, product } = useGetItemById();

  const handlePayInit = async () => {
    const response = await handlePay(prodInfo);
    if (response?.url) {
      window.location.href = response.url;
    }
  };

  useEffect(() => {
    const getProduct = async () => {
      const data = await product(id);
      setProdInfo(data);
    };
    getProduct();
  }, [id]);

  const isFarmer = prodInfo?.seller_type?.toLowerCase() === "farmer";

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-6">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545850] hover:text-[#590907] transition"
            >
              <IoMdArrowRoundBack className="text-sm" />
              <span>Back to Marketplace</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner2 />
              <span className="text-xs font-semibold text-[#545850]">
                Loading Product Details...
              </span>
            </div>
          ) : prodInfo ? (
            <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Product Image */}
              <div className="lg:col-span-6 h-80 sm:h-96 rounded-2xl bg-[#E8D2B5]/25 border border-[#A5A79B]/25 overflow-hidden flex items-center justify-center p-4">
                {prodInfo.image_url ? (
                  <img
                    src={prodInfo.image_url}
                    alt={prodInfo.product_name}
                    className="w-full h-full object-contain rounded-xl"
                  />
                ) : (
                  <MdOutlineStorefront className="text-5xl text-[#A5A79B]" />
                )}
              </div>

              {/* Product Details & Checkout */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isFarmer
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-[#E8D2B5] text-[#590907] border border-[#590907]/25"
                      }`}
                    >
                      {prodInfo.seller_type || "Verified Seller"}
                    </span>
                    {prodInfo.updatedAt && (
                      <span className="text-xs text-[#A5A79B]">
                        Listed {new Date(prodInfo.updatedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B] mb-2">
                    {prodInfo.product_name}
                  </h1>

                  <p className="text-sm text-[#545850] mb-6">
                    Sold by <strong className="text-[#1C1E1B]">{prodInfo.seller_name}</strong>
                  </p>

                  <div className="p-4 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 mb-6">
                    <span className="text-xs text-[#545850] block mb-1">Unit Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-[#590907]">
                        ₹{prodInfo.price}
                      </span>
                      <span className="text-xs text-[#545850]">per unit / kg</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-[#545850] bg-[#FDFBF7] p-3.5 rounded-xl border border-[#A5A79B]/25">
                    <MdOutlineVerifiedUser className="text-base text-[#590907] shrink-0 mt-0.5" />
                    <span>
                      Direct agricultural procurement with instant digital invoice generation upon order confirmation.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayInit}
                  disabled={payLoading}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-sm shadow hover:bg-[#420605] transition disabled:opacity-50"
                >
                  {payLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <MdOutlineShoppingBag className="text-base" />
                      <span>Proceed to Checkout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl shadow-sm">
              <p className="text-sm text-[#545850]">Product not found.</p>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MarketplaceBuy;
