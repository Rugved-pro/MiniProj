/* eslint-disable react/prop-types */
import { MdOutlineLocalShipping, MdOutlinePerson, MdOutlineStorefront } from "react-icons/md";

const OrderCard = ({ order }) => {
  return (
    <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5">
      <div className="w-full md:w-36 h-36 rounded-xl overflow-hidden bg-[#E8D2B5]/25 border border-[#A5A79B]/25 shrink-0 flex items-center justify-center">
        {order.image_url ? (
          <img
            src={order.image_url}
            alt={order.product_name || order.product_id}
            className="w-full h-full object-cover"
          />
        ) : (
          <MdOutlineStorefront className="text-3xl text-[#A5A79B]" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
        {/* Product Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#590907]">
            <MdOutlineStorefront className="text-sm" />
            <span>Product Details</span>
          </div>
          <h3 className="text-base font-bold font-serif text-[#1C1E1B]">
            {order.product_name}
          </h3>
          <p className="text-xs text-[#545850]">
            Seller: <strong className="text-[#1C1E1B]">{order.seller_name}</strong>{" "}
            {order.seller_type && (
              <span className="capitalize text-[#A5A79B]">({order.seller_type})</span>
            )}
          </p>
          <p className="text-[11px] text-[#A5A79B] font-mono break-all">
            ID: {order.product_id}
          </p>
        </div>

        {/* Customer Details */}
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#590907]">
            <MdOutlinePerson className="text-sm" />
            <span>Customer Details</span>
          </div>
          <p className="text-sm font-semibold text-[#1C1E1B] break-words">
            {order.customer_name}
          </p>
          <p className="text-xs text-[#545850] break-words">{order.customer_email}</p>
          <p className="text-xs text-[#A5A79B]">{order.customer_mobile}</p>
        </div>

        {/* Delivery & Amount */}
        <div className="space-y-1 sm:text-right flex flex-col justify-between">
          <div>
            <div className="flex items-center sm:justify-end gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#590907]">
              <MdOutlineLocalShipping className="text-sm" />
              <span>Delivery Address</span>
            </div>
            <p className="text-xs text-[#545850] mt-1">{order.delivery || "Standard Regional Delivery"}</p>
          </div>

          <div className="pt-2 border-t border-[#A5A79B]/20 mt-2">
            <span className="text-xs text-[#545850] mr-1.5">Total Paid:</span>
            <span className="text-lg font-bold text-[#590907]">₹{order.amount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
