import { createLocalModel } from "../db/localDb.js";

const MandiWatchlist = createLocalModel(
    "mandiWatchlist",
    {
        userId: "",
        crop: "",
        state: "",
        market: "",
        targetPrice: 0,
        notes: ""
    },
    true
);

export default MandiWatchlist;
