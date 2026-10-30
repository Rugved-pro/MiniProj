import { useEffect, useState } from "react";
import useGetMySellings from "../../hooks/useGetMySellings";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import ItemCard from "../../components/ItemCard";
import { Link } from "react-router-dom";
import { IoMdArrowRoundBack } from "react-icons/io";
import { MdOutlineAddCircleOutline, MdOutlineInventory2 } from "react-icons/md";
import Spinner2 from "../../components/Spinner2";

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const { loading, sellings } = useGetMySellings();

  useEffect(() => {
    const getListings = async () => {
      const data = await sellings();
      if (Array.isArray(data)) {
        setListings(data);
      }
    };
    getListings();
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
                Seller Inventory
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                My Marketplace Listings
              </h1>
              <p className="text-xs text-[#545850] mt-0.5">
                Products and harvest batches you have published for direct sale
              </p>
            </div>

            <Link
              to="/marketplace/sell"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition self-start sm:self-auto"
            >
              <MdOutlineAddCircleOutline className="text-base" />
              <span>List New Product</span>
            </Link>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <Spinner2 />
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {listings.map((listing, index) => (
                <ItemCard item={listing} key={listing._id || index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-3 text-2xl">
                <MdOutlineInventory2 />
              </div>
              <h3 className="text-base font-bold font-serif text-[#1C1E1B] mb-1">
                No Active Listings Yet
              </h3>
              <p className="text-xs text-[#545850] max-w-sm mx-auto mb-5">
                You haven&apos;t listed any crops or agricultural products for sale yet. Create your first listing to reach buyers directly.
              </p>
              <Link
                to="/marketplace/sell"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <MdOutlineAddCircleOutline className="text-base" />
                <span>Create First Listing</span>
              </Link>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default MyListings;
