import { createLocalModel } from "../db/localDb.js";

const Payment = createLocalModel(
    "payments",
    {
        product_id: "",
        payment_intent_id: "",
        product_name: "",
        image_url: "",
        seller: "",
        seller_name: "",
        seller_type: "farmer",
        amount: 0,
        customer_name: "",
        customer_email: "",
        customer_mobile: "",
        delivery: ""
    },
    true
);

export default Payment;