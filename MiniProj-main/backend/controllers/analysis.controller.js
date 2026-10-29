import Prediction from "../models/predictions.model.js";
import { client } from "../redis/client.js";

function computeFallbackAnalysis({ rain = 250, soil_N = 0.5, soil_P = 0.5, soil_K = 0.5, soil_pH = 6.5, temp = 300, hum = 68 }) {
    const crops = [];
    if (rain > 250) crops.push("Rice", "Sugarcane");
    else crops.push("Wheat", "Corn");
    if (soil_pH >= 5.5 && soil_pH <= 7.5) crops.push("Potato");

    const diseases = [];
    if (hum > 70) diseases.push("Leaf_Blast");
    else if (rain > 280) diseases.push("Red_Rot");
    else diseases.push("Brown_Rust");

    return {
        predictions: {
            crops,
            diseases
        }
    };
}

export const analysis = async (req, res) => {
    const apiUrl = process.env.ML_URL || "http://127.0.0.1:8000";

    try {
        const {
            rain = 250,
            soil_N = 0.5,
            soil_K = 0.5,
            soil_P = 0.5,
            soil_pH = 6.5,
            temp = 300.15,
            hum = 68
        } = req.body;
        const id = req.params.id;

        const cacheValue = await client.get(`analysis:${id}`);
        if (cacheValue) {
            return res.status(200).json(JSON.parse(cacheValue));
        }

        const payload = {
            rain: Number(rain) || 250,
            soil_N: Number(soil_N) || 0.5,
            soil_K: Number(soil_K) || 0.5,
            soil_P: Number(soil_P) || 0.5,
            soil_pH: Number(soil_pH) || 6.5,
            temp: Number(temp) || 300.15,
            hum: Number(hum) || 68
        };

        let data = null;
        try {
            const response = await fetch(`${apiUrl}/analysis`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                data = await response.json();
            }
        } catch (mlErr) {
            console.warn("ML /analysis unreachable, using local fallback:", mlErr.message);
        }

        if (!data || !data.predictions) {
            data = computeFallbackAnalysis(payload);
        }

        const analysisData = { ...data, id };
        await client.set(`analysis:${id}`, JSON.stringify(analysisData));
        await client.expire(`analysis:${id}`, 30 * 60);
        res.status(200).json(analysisData);
    } catch (err) {
        console.log("Error in Generating Predictions", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const analysis2 = async (req, res) => {
    try {
        const id = req.params.id;
        const predictions = await Prediction.find({ userId: id });

        if (predictions) {
            const diseaseFrequency = {};
            const pesticideFrequency = {};

            /* Creating Hash Map of pesticides & diseases */
            predictions.forEach((prediction) => {
                if (prediction.disease) {
                    diseaseFrequency[prediction.disease] = (diseaseFrequency[prediction.disease] || 0) + 1;
                }

                if (prediction.pesticides && prediction.pesticides.length > 0) {
                    prediction.pesticides.forEach((pesticide) => {
                        pesticideFrequency[pesticide] = (pesticideFrequency[pesticide] || 0) + 1;
                    });
                }
            });

            res.status(200).json({
                diseaseFrequency,
                pesticideFrequency,
            });
        } else {
            res.status(404).json({ error: "No predictions found for this user" });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const analysis3 = async (req, res) => {
    const apiUrl = process.env.ML_URL || "http://127.0.0.1:8000";

    try {
        const {
            rain = 250,
            soil_N = 0.5,
            soil_K = 0.5,
            soil_P = 0.5,
            soil_pH = 6.5,
            temp = 300.15,
            hum = 68
        } = req.body;

        const payload = {
            rain: Number(rain) || 250,
            soil_N: Number(soil_N) || 0.5,
            soil_K: Number(soil_K) || 0.5,
            soil_P: Number(soil_P) || 0.5,
            soil_pH: Number(soil_pH) || 6.5,
            temp: Number(temp) || 300.15,
            hum: Number(hum) || 68
        };

        let data = null;
        try {
            const response = await fetch(`${apiUrl}/analysis`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                data = await response.json();
            }
        } catch (mlErr) {
            console.warn("ML /analysis unreachable, using local fallback:", mlErr.message);
        }

        if (!data || !data.predictions) {
            data = computeFallbackAnalysis(payload);
        }

        res.status(200).json(data);
    } catch (err) {
        console.log("Error in Generating Predictions", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};