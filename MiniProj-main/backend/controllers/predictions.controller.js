import Prediction from "../models/predictions.model.js";
import Farm from "../models/farm.model.js";
import { client } from "../redis/client.js";

export const uploadAndPredict = async (req, res) => {
    const apiUrl = process.env.ML_URL || "http://127.0.0.1:8000";

    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const {
            url,
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
        } = req.body;

        const normalizedUrls = Array.isArray(url) ? url.filter(Boolean) : [url].filter(Boolean);
        if (normalizedUrls.length === 0) {
            return res.status(400).json({ error: "At least one image is required" });
        }

        // Look up user's active farm plot if available to contextualize field parameters honestly
        let resolvedLocation = location;
        if (!resolvedLocation) {
            const farm = await Farm.findOne({ userId });
            resolvedLocation = farm?.district
                ? `${farm.district}, ${farm.state || "India"}`
                : "Field Plot";
        }

        let response;
        try {
            response = await fetch(`${apiUrl}/predict`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: String(userId),
                    url: normalizedUrls,
                    location: String(resolvedLocation),
                    rainAct: Number(rainAct) || 0,
                    rainNorm: Number(rainNorm) || 0,
                    rainDep: Number(rainDep) || 0,
                    soil_N: Number(soil_N) || 0,
                    soil_K: Number(soil_K) || 0,
                    soil_P: Number(soil_P) || 0,
                    soil_pH: Number(soil_pH) || 6.5,
                    temp: Number(temp) || 298.15,
                    hum: Number(hum) || 60,
                }),
            });
        } catch (mlErr) {
            console.error("ML server unreachable for /predict:", mlErr.message);
            return res.status(502).json({ error: "Prediction service is unavailable" });
        }

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            const error = result.detail || result.error || "Prediction failed";
            return res.status(response.status === 422 ? 422 : 502).json({ error });
        }

        const data = await response.json();
        if (!data.crop || !data.disease) {
            console.error("ML /predict returned an incomplete prediction.");
            return res.status(502).json({ error: "Prediction service returned an invalid response" });
        }

        const newPrediction = new Prediction({
            userId: String(userId),
            url: data.url,
            location: data.location || resolvedLocation,
            crop: data.crop,
            rainAct: Number(rainAct) || 0,
            rainNorm: Number(rainNorm) || 0,
            rainDep: Number(rainDep) || 0,
            soil_N: Number(soil_N) || 0,
            soil_K: Number(soil_K) || 0,
            soil_P: Number(soil_P) || 0,
            soil_pH: Number(soil_pH) || 6.5,
            temp: Number(temp) || 298.15,
            hum: Number(hum) || 60,
            disease: data.disease,
            confidence: Number(data.confidence) || 0,
            top3: Array.isArray(data.top3) ? data.top3 : [],
            is_uncertain: Boolean(data.is_uncertain),
            sharpness: Number(data.sharpness) || 0,
            quality_warning: data.quality_warning || "",
            disease_details: data.disease_details || [],
            recomm: data.recomm || [],
            pesticides: data.pesticides || [],
        });

        const prediction = await newPrediction.save();
        if (client) {
            await client.del(`userHistory:${userId}`).catch(() => {});
        }

        return res.status(201).json(prediction);
    } catch (err) {
        console.error("Error in Generating Predictions:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPredictions = async (req, res) => {
    try {
        // Enforce administrative scope or user-specific records
        if (!req.user?.isAdmin) {
            const userPredictions = await Prediction.find({ userId: String(req.user._id) });
            return res.status(200).json(userPredictions);
        }
        const predictions = await Prediction.find({});
        return res.status(200).json(predictions);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getPredictionById = async (req, res) => {
    try {
        const id = req.params.id;
        const prediction = await Prediction.findById(id);
        if (!prediction) {
            return res.status(404).json({ error: "Prediction record not found" });
        }

        // Data isolation: only the owner or an admin can access this diagnosis
        const authUserId = req.user?._id?.toString();
        if (prediction.userId && authUserId && prediction.userId.toString() !== authUserId && !req.user.isAdmin) {
            return res.status(403).json({ error: "Access denied to diagnosis record" });
        }

        return res.status(200).json(prediction);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMyHistory = async (req, res) => {
    try {
        const requestedUserId = req.params.id;
        const authUserId = req.user?._id?.toString();

        // Enforce authorization: user can only query their own diagnosis history
        if (authUserId && requestedUserId !== authUserId && !req.user.isAdmin) {
            return res.status(403).json({ error: "Access denied: cannot access another farmer's history" });
        }

        const userId = requestedUserId;
        if (client) {
            const cachedHistory = await client.get(`userHistory:${userId}`).catch(() => null);
            if (cachedHistory) {
                return res.status(200).json(JSON.parse(cachedHistory));
            }
        }

        const predictions = await Prediction.find({ userId: userId });
        if (client) {
            await client.set(`userHistory:${userId}`, JSON.stringify(predictions)).catch(() => {});
            await client.expire(`userHistory:${userId}`, 30 * 24 * 60 * 60).catch(() => {});
        }
        return res.status(200).json(predictions);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
