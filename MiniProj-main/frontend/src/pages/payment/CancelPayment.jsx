import { Link } from "react-router-dom";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { MdOutlineCancel, MdOutlineStorefront, MdOutlineHome } from "react-icons/md";

const CancelPayment = () => {
  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-lg mx-auto px-6 py-16">
          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center mx-auto mb-4 text-3xl">
              <MdOutlineCancel />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
              Checkout Interrupted
            </span>
            <h1 className="text-2xl font-bold font-serif text-[#1C1E1B] mb-2">
              Payment Cancelled
            </h1>
            <p className="text-xs sm:text-sm text-[#545850] mb-6">
              Your marketplace order was cancelled and no charges were made. You can return to the marketplace anytime to resume shopping.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/marketplace"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <MdOutlineStorefront className="text-base" />
                <span>Return to Marketplace</span>
              </Link>
              <Link
                to="/home"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#FDFBF7] text-[#545850] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
              >
                <MdOutlineHome className="text-base" />
                <span>Back to Overview</span>
              </Link>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default CancelPayment;
