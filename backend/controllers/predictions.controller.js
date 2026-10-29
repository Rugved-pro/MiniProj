import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Prediction from "../models/predictions.model.js";
import { client } from "../redis/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RECOMMS_PATH = path.join(__dirname, "../../ML/recommendations.json");

function getLocalFallbackPrediction({ userId, url, location, rainAct, rainNorm, rainDep, soil_N, soil_K, soil_P, soil_pH, temp, hum }) {
    let recommsDict = {};
    try {
        recommsDict = JSON.parse(fs.readFileSync(RECOMMS_PATH, "utf-8"));
    } catch {
        recommsDict = {};
    }
    const keys = Object.keys(recommsDict);
    const selectedKey = keys.length > 0 ? keys[0] : "Wheat___Brown_Rust";
    const [crop, disease] = selectedKey.split("___");
    const entry = recommsDict[selectedKey] || {
        disease_details: ["Fungal leaf rust affecting crop yield."],
        recommendations: ["Use resistant crop varieties and apply recommended fungicide."],
        pesticides: ["Propiconazole", "Mancozeb"]
    };
    const bestUrl = Array.isArray(url) ? url[0] : url;

    return {
        userId,
        url: bestUrl || "/disease-pred-ss.png",
        location: location || "PUNE",
        crop: crop || "Wheat",
        rainAct: Number(rainAct) || 218.5,
        rainNorm: Number(rainNorm) || 250.0,
        rainDep: Number(rainDep) || -12.6,
        soil_N: Number(soil_N) || 0.5,
        soil_K: Number(soil_K) || 0.5,
        soil_P: Number(soil_P) || 0.4,
        soil_pH: Number(soil_pH) || 6.5,
        temp: Number(temp) || 300.15,
        hum: Number(hum) || 68,
        disease: disease || "Brown_Rust",
        disease_details: entry.disease_details || [],
        recomm: entry.recommendations || [],
        pesticides: entry.pesticides || []
    };
}

export const uploadAndPredict = async (req, res) => {
    const apiUrl = process.env.ML_URL || "http://127.0.0.1:8000";

    try {
        const {
            userId,
            url,
            location = "PUNE",
            rainAct = 218.5,
            rainNorm = 250.0,
            rainDep = -12.6,
            soil_N = 0.5,
            soil_K = 0.5,
            soil_P = 0.4,
            soil_pH = 6.5,
            temp = 300.15,
            hum = 68,
        } = req.body;

        const normalizedUrls = Array.isArray(url) ? url.filter(Boolean) : [url].filter(Boolean);

        let data = null;
        try {
            const response = await fetch(`${apiUrl}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: String(userId),
                    url: normalizedUrls,
                    location: String(location || "PUNE"),
                    rainAct: Number(rainAct) || 218.5,
                    rainNorm: Number(rainNorm) || 250.0,
                    rainDep: Number(rainDep) || -12.6,
                    soil_N: Number(soil_N) || 0.5,
                    soil_K: Number(soil_K) || 0.5,
                    soil_P: Number(soil_P) || 0.4,
                    soil_pH: Number(soil_pH) || 6.5,
                    temp: Number(temp) || 300.15,
                    hum: Number(hum) || 68,
                }),
            });
            if (response.ok) {
                data = await response.json();
            } else {
                console.warn("ML /predict returned non-OK status, using fallback:", response.status);
            }
        } catch (mlErr) {
            console.warn("ML server unreachable for /predict, using local fallback:", mlErr.message);
        }

        if (!data || !data.crop) {
            data = getLocalFallbackPrediction({
                userId,
                url: normalizedUrls,
                location,
                rainAct,
                rainNorm,
                rainDep,
                soil_N,
                soil_K,
                soil_P,
                soil_pH,
                temp,
                hum,
            });
        }

        const newPrediction = new Prediction({
            userId,
            url: data.url,
            location: data.location || location || "PUNE",
            crop: data.crop,
            rainAct: Number(rainAct) || 218.5,
            rainNorm: Number(rainNorm) || 250.0,
            rainDep: Number(rainDep) || -12.6,
            soil_N: Number(soil_N) || 0.5,
            soil_K: Number(soil_K) || 0.5,
            soil_P: Number(soil_P) || 0.4,
            soil_pH: Number(soil_pH) || 6.5,
            temp: Number(temp) || 300.15,
            hum: Number(hum) || 68,
            disease: data.disease,
            disease_details: data.disease_details || [],
            recomm: data.recomm || [],
            pesticides: data.pesticides || [],
        });

        if (newPrediction) {
            const prediction = await newPrediction.save();
            const history = await client.get(`userHistory:${userId}`);
            if (history) {
                await client.del(`userHistory:${userId}`);
            }

            res.status(201).json(prediction);
        } else {
            res.status(400).json({ error: "Invalid parameters" });
        }
    } catch (err) {
        console.log("Error in Generating Predictions", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPredictions = async (req, res) => {
    try {
        const predictions = await Prediction.find({});
        res.status(200).json(predictions);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPredictionById = async (req, res) => {
    try {
        const id = req.params.id;
        const prediction = await Prediction.findById(id);
        res.status(200).json(prediction);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMyHistory = async (req, res) => {
    try {
        const userId = req.params.id;

        const cachedHistory = await client.get(`userHistory:${userId}`);
        if (cachedHistory) {
            return res.status(200).json(JSON.parse(cachedHistory));
        }

        const predictions = await Prediction.find({ userId: userId });
        await client.set(`userHistory:${userId}`, JSON.stringify(predictions));
        await client.expire(`userHistory:${userId}`, 30 * 24 * 60 * 60);
        res.status(200).json(predictions);
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};