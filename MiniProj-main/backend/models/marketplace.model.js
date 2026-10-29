import { createLocalModel } from "../db/localDb.js";

const Product = createLocalModel(
    "products",
    {
        product_name: "",
        image_url: "",
        seller: "",
        seller_name: "",
        seller_type: "farmer",
        price: 0
    },
    true
);

export default Product;