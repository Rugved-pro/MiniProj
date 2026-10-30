import { Link, useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import useBuyItem from "../../hooks/useBuyItem";
import { useState, useEffect, useRef } from "react";
import useGetItemById from "../../hooks/useGetItemById";
import Spinner from "../../components/Spinner";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { MdOutlineCheckCircle, MdOutlineDownload, MdOutlineReceiptLong } from "react-icons/md";
import { IoMdArrowRoundBack } from "react-icons/io";

const CompletePayment = () => {
  const location = useLocation();
  const { payLoading, buy } = useBuyItem();
  const [prodInfo, setProdInfo] = useState(null);
  const [paramsData, setParamsData] = useState({
    session_id: "",
    order_id: "",
  });
  const { loading, product } = useGetItemById();
  const [totalAmt, setTotalAmt] = useState();
  const [buyData, setBuyData] = useState();
  const invoiceRef = useRef();

  const getProduct = async () => {
    const queryParams = new URLSearchParams(location.search);
    const session_id = queryParams.get("session_id");
    const order_id = queryParams.get("order_id");

    const updatedData = {
      session_id,
      order_id,
    };
    setParamsData(updatedData);

    const data = await product(updatedData.order_id);
    setProdInfo(data);
    setTotalAmt(Number(data?.price || 0) + 46);
  };

  useEffect(() => {
    getProduct();
  }, [location.search]);

  const buyItem = async () => {
    const order_id = paramsData.order_id;
    const session_id = paramsData.session_id;
    const data = await buy({ order_id, session_id });
    setBuyData(data);
  };

  const downloadPDF = () => {
    const tempElement = document.createElement("div");
    const element = invoiceRef.current;
    const additionalContent = `
      <h2 class="text-xl font-semibold mb-4">Ceres Marketplace - Order Invoice</h2>
      <div class="border-t border-gray-300 pt-4"></div>
    `;

    tempElement.innerHTML = additionalContent + element.innerHTML;

    const options = {
      margin: 1,
      filename: `invoice_${paramsData.order_id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf().from(tempElement).set(options).save();
  };

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-xl mx-auto px-6 py-10">
          <div className="mb-6">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545850] hover:text-[#590907] transition"
            >
              <IoMdArrowRoundBack className="text-sm" />
              <span>Back to Marketplace</span>
            </Link>
          </div>

          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm">
            {loading && !prodInfo && !paramsData && !totalAmt ? (
              <div className="py-12 flex justify-center">
                <Spinner />
              </div>
            ) : !buyData ? (
              <>
                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                  Order Verification
                </span>
                <h1 className="text-2xl font-bold font-serif text-[#1C1E1B] mb-4">
                  Confirm Your Order
                </h1>

                <div className="border-t border-[#A5A79B]/25 pt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#545850]">Order ID</span>
                    <span className="font-mono text-xs text-[#1C1E1B]">{paramsData?.order_id || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#545850]">Product</span>
                    <span className="font-semibold text-[#1C1E1B]">{prodInfo?.product_name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#545850]">Seller</span>
                    <span className="text-[#1C1E1B]">
                      {prodInfo?.seller_name || "N/A"}{" "}
                      {prodInfo?.seller_type && <span className="capitalize text-xs text-[#545850]">({prodInfo.seller_type})</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#545850]">Item Price</span>
                    <span className="text-[#1C1E1B]">₹{prodInfo?.price || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#545850]">Taxes &amp; Delivery</span>
                    <span className="text-[#1C1E1B]">₹46</span>
                  </div>

                  <div className="border-t border-[#A5A79B]/25 pt-3 flex justify-between items-baseline">
                    <span className="font-bold text-[#1C1E1B]">Total Payable</span>
                    <span className="text-xl font-bold text-[#590907]">₹{totalAmt || "N/A"}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={buyItem}
                  disabled={payLoading}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-sm shadow hover:bg-[#420605] transition disabled:opacity-50"
                >
                  {payLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <MdOutlineCheckCircle className="text-base" />
                      <span>Confirm &amp; Generate Invoice</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-1">
                  <MdOutlineCheckCircle className="text-base" />
                  <span>Order Confirmed</span>
                </div>
                <h1 className="text-2xl font-bold font-serif text-[#1C1E1B] mb-4">
                  Digital Order Invoice
                </h1>

                {buyData.image_url && (
                  <div className="h-48 w-full rounded-xl overflow-hidden bg-[#F7EFE4] border border-[#A5A79B]/25 mb-4 flex items-center justify-center p-2">
                    <img
                      src={buyData.image_url}
                      alt={buyData.product_name}
                      className="max-h-full object-contain rounded-lg"
                    />
                  </div>
                )}

                <div
                  ref={invoiceRef}
                  className="p-4 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/30 space-y-4 text-xs sm:text-sm"
                >
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#590907] block">
                      Product Details
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Product:</span>
                      <span className="font-semibold text-[#1C1E1B]">{buyData.product_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Seller:</span>
                      <span className="text-[#1C1E1B]">{buyData.seller_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Seller Type:</span>
                      <span className="capitalize text-[#1C1E1B]">{buyData.seller_type}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#A5A79B]/25 pt-3 space-y-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#590907] block">
                      Customer Details
                    </span>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Name:</span>
                      <span className="text-[#1C1E1B]">{buyData.customer_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Email:</span>
                      <span className="text-[#1C1E1B]">{buyData.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Mobile:</span>
                      <span className="text-[#1C1E1B]">{buyData.customer_mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#545850]">Delivery:</span>
                      <span className="text-right max-w-[200px] text-[#1C1E1B]">{buyData.delivery}</span>
                    </div>
                  </div>

                  <div className="border-t border-[#A5A79B]/25 pt-3 flex justify-between items-baseline text-base">
                    <span className="font-bold text-[#1C1E1B]">Total Paid:</span>
                    <span className="font-bold text-[#590907]">₹{buyData.amount}</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
                  >
                    <MdOutlineDownload className="text-base" />
                    <span>Download PDF Invoice</span>
                  </button>
                  <Link
                    to="/marketplace/orders"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full bg-[#FDFBF7] text-[#590907] border border-[#590907]/40 font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                  >
                    <MdOutlineReceiptLong className="text-base" />
                    <span>View My Orders</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CompletePayment;
