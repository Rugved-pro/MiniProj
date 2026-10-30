import { createLocalModel } from "../db/localDb.js";

const Order = createLocalModel(
    "orders",
    {
        user: "",
        orders: []
    },
    true
);

export default Order;