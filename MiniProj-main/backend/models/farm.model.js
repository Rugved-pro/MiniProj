import { createLocalModel } from "../db/localDb.js";

const Farm = createLocalModel(
    "farms",
    {
        userId: "",
        farmerName: "",
        phone: "",
        state: "Maharashtra",
        district: "Pune",
        preferredLanguage: "en",
        activePlotId: "",
        plots: []
    },
    true
);

export default Farm;
