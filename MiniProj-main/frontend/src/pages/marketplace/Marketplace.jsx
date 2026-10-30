import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { MdOutlineStorefront, MdOutlineAddCircleOutline, MdOutlineInventory2, MdOutlineReceiptLong } from "react-icons/md";
import "./market.css";
import useGetItems from "../../hooks/useGetItems";
import ItemCard from "../../components/ItemCard";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import Spinner2 from "../../components/Spinner2";

const Marketplace = () => {
  const { loading, items } = useGetItems();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const getItems = async () => {
      const data = await items();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    };
    getItems();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = item.product_name
        ?.toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesSeller =
        sellerFilter === "all" ||
        item.seller_type?.toLowerCase() === sellerFilter;
      return matchesSearch && matchesSeller;
    });
  }, [products, search, sellerFilter]);

  return (
    <div className="min-h-screen bg-[#F7EFE4] text-[#1C1E1B] flex flex-col justify-between">
      <div>
        <Navbar />

        <main className="max-w-6xl mx-auto px-6 py-10">
          {/* Header Banner */}
          <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#590907] mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#590907]"></span>
                  <span>Agricultural Commerce &amp; Inputs</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B]">
                  Farmer &amp; Agri Marketplace
                </h1>
                <p className="text-xs sm:text-sm text-[#545850] mt-1">
                  Source verified crops, seeds, fertilizers, and farm equipment directly from farmers and regional retailers.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate("/marketplace/sell")}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
                >
                  <MdOutlineAddCircleOutline className="text-base" />
                  <span>Sell Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/marketplace/my-listings")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#590907] border border-[#590907]/35 font-semibold text-xs hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                >
                  <MdOutlineInventory2 className="text-sm" />
                  <span>My Listings</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/marketplace/orders")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#590907] hover:text-[#590907] transition"
                >
                  <MdOutlineReceiptLong className="text-sm" />
                  <span>My Orders</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Seller Type Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <HiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545850] text-base" />
              <input
                type="text"
                placeholder="Search crops, seeds, or farm equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FDFBF7] border border-[#A5A79B]/45 text-xs sm:text-sm text-[#1C1E1B] placeholder-[#A5A79B] focus:outline-none focus:border-[#590907] shadow-sm transition"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-[#545850] font-semibold">Seller:</span>
              {[
                { key: "all", label: "All Listings" },
                { key: "farmer", label: "Farmers" },
                { key: "retailer", label: "Retailers" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSellerFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                    sellerFilter === tab.key
                      ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                      : "bg-[#FDFBF7] text-[#545850] border border-[#A5A79B]/40 hover:border-[#590907] hover:text-[#590907]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Spinner2 />
              <span className="text-xs font-semibold text-[#545850]">
                Loading Marketplace Listings...
              </span>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.map((item, index) => (
                <ItemCard item={item} key={item._id || index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl shadow-sm">
              <div className="w-14 h-14 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-3 text-2xl">
                <MdOutlineStorefront />
              </div>
              <h3 className="text-base font-bold font-serif text-[#1C1E1B] mb-1">
                No Matching Marketplace Listings
              </h3>
              <p className="text-xs text-[#545850] max-w-sm mx-auto mb-5">
                {search || sellerFilter !== "all"
                  ? "No products matched your current filter criteria. Try clearing your search or switching seller categories."
                  : "There are no products listed in the marketplace right now. Be the first to list your harvest or farm inputs."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/marketplace/sell")}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition"
              >
                <MdOutlineAddCircleOutline className="text-base" />
                <span>List a Product for Sale</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Marketplace;
