import { createLocalModel } from "../db/localDb.js";

const Metadata = createLocalModel(
    "metadata",
    {
        user: "",
        correct: 0,
        incorrect: 0,
        greenPoints: 0,
        totalGP: 250
    },
    true
);

export default Metadata;