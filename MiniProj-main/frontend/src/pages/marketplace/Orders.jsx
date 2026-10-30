import { useEffect, useState } from "react";
import useGetMyOrders from "../../hooks/useGetMyOrders";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import OrderCard from "../../components/OrderCard";
import { Link } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdOutlineReceiptLong, MdOutlineStorefront } from "react-icons/md";
import Spinner2 from "../../components/Spinner2";

const Orders = () => {
  const { loading, orders } = useGetMyOrders();
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    const getOrders = async () => {
      const data = await orders();
      if (Array.isArray(data)) {
        setMyOrders(data);
      }
    };
    getOrders();
  }, []);

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 py-10">
          <div className="mb-4">
            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#545850] hover:text-[#590907] transition"
            >
              <IoMdArrowRoundBack className="text-sm" />
              <span>Back to Marketplace</span>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#A5A79B]/30 gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                Procurement History
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                My Marketplace Orders
              </h1>
              <p className="text-xs text-[#545850] mt-0.5">
                Confirmed agricultural purchases and delivery details
              </p>
            </div>

            <Link
              to="/marketplace"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition self-start sm:self-auto"
            >
              <MdOutlineStorefront className="text-base" />
              <span>Browse Marketplace</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Spinner2 />
            </div>
          ) : myOrders.length > 0 ? (
            <div className="space-y-4">
              {myOrders
                .slice()
                .reverse()
                .map((order, idx) => (
                  <OrderCard order={order} key={order._id || idx} />
                ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-3 text-2xl">
                <MdOutlineReceiptLong />
              </div>
              <h3 className="text-base font-bold font-serif text-[#1C1E1B] mb-1">
                No Orders Placed Yet
              </h3>
              <p className="text-xs text-[#545850] max-w-sm mx-auto mb-5">
                Your completed marketplace purchases and invoices will appear here once you place an order.
              </p>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <MdOutlineStorefront className="text-base" />
                <span>Explore Marketplace</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Orders;
