import { createLocalModel } from "../db/localDb.js";

const Prediction = createLocalModel(
    "predictions",
    {
        userId: "",
        url: "",
        location: "",
        crop: "",
        rainAct: 0,
        rainNorm: 0,
        rainDep: 0,
        soil_N: 0,
        soil_P: 0,
        soil_K: 0,
        soil_pH: 0,
        temp: 0,
        hum: 0,
        disease: "",
        disease_details: [],
        recomm: [],
        pesticides: []
    },
    true
);

export default Prediction;