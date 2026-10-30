/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import { MdOutlineStorefront, MdArrowForward } from "react-icons/md";

const ItemCard = ({ item }) => {
  const navigate = useNavigate();
  const isFarmer = item.seller_type?.toLowerCase() === "farmer";
  const formattedDate = item.updatedAt
    ? new Date(item.updatedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently listed";

  return (
    <div
      onClick={() => navigate(`/marketplace/buy/${item._id}`)}
      className="group border border-[#A5A79B]/35 rounded-2xl overflow-hidden bg-[#FDFBF7] hover:border-[#590907]/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="h-48 w-full bg-[#E8D2B5]/25 relative overflow-hidden flex items-center justify-center p-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.product_name}
              className="w-full h-full object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#A5A79B]">
              <MdOutlineStorefront className="text-4xl" />
            </div>
          )}
          <span
            className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm ${
              isFarmer
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : "bg-[#E8D2B5] text-[#590907] border border-[#590907]/25"
            }`}
          >
            {item.seller_type || "Seller"}
          </span>
        </div>

        <div className="p-4">
          <h3 className="text-base font-bold font-serif text-[#1C1E1B] line-clamp-1 mb-1">
            {item.product_name}
          </h3>

          <p className="text-xs text-[#545850] mb-1">
            Seller: <strong className="text-[#1C1E1B]">{item.seller_name || "Verified Seller"}</strong>
          </p>
          <span className="text-[11px] text-[#A5A79B] block mb-3">
            Listed {formattedDate}
          </span>

          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-[#590907]">₹{item.price}</span>
            <span className="text-[11px] text-[#545850]">/ unit</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 bg-[#F7EFE4] border-t border-[#A5A79B]/25 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#545850]">Direct Procurement</span>
        <span className="text-xs font-semibold text-[#590907] group-hover:underline inline-flex items-center gap-1">
          <span>View &amp; Buy</span>
          <MdArrowForward className="text-sm" />
        </span>
      </div>
    </div>
  );
};

export default ItemCard;
