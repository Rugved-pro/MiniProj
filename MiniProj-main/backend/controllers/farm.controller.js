import Farm from "../models/farm.model.js";
import crypto from "crypto";

const DEFAULT_PLOTS = (crop = "Wheat") => [
    {
        _id: crypto.randomBytes(8).toString("hex"),
        name: "Main Field - Plot A",
        area: 2.5,
        areaUnit: "Acres",
        crop: crop || "Wheat",
        variety: "High-Yield Sharbati",
        sowingDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        growthStage: "Vegetative / Tillering",
        soilType: "Loamy",
        irrigationMethod: "Drip Irrigation",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const getFarmProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        let farm = await Farm.findOne({ userId });

        if (!farm) {
            const initialPlots = DEFAULT_PLOTS(req.user.crops?.[0]);
            farm = await Farm.create({
                userId,
                farmerName: req.user.name || "Kisan Mitra",
                phone: req.user.phoneno || "",
                state: "Maharashtra",
                district: "Pune",
                preferredLanguage: "en",
                activePlotId: initialPlots[0]._id,
                plots: initialPlots
            });
        }

        // If plots array is empty, ensure at least one plot exists
        if (!farm.plots || farm.plots.length === 0) {
            const initialPlots = DEFAULT_PLOTS(req.user.crops?.[0]);
            farm = await Farm.findByIdAndUpdate(
                farm._id,
                { plots: initialPlots, activePlotId: initialPlots[0]._id },
                { new: true }
            );
        }

        const activePlot = farm.plots.find(p => p._id === farm.activePlotId) || farm.plots[0];

        return res.status(200).json({
            success: true,
            profile: farm,
            activePlot
        });
    } catch (error) {
        console.error("Error fetching farm profile:", error);
        return res.status(500).json({ error: "Failed to load farm profile" });
    }
};

export const updateFarmProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { farmerName, state, district, preferredLanguage, activePlotId } = req.body;

        let farm = await Farm.findOne({ userId });
        if (!farm) {
            const initialPlots = DEFAULT_PLOTS(req.user.crops?.[0]);
            farm = await Farm.create({
                userId,
                farmerName: farmerName || req.user.name,
                phone: req.user.phoneno || "",
                state: state || "Maharashtra",
                district: district || "Pune",
                preferredLanguage: preferredLanguage || "en",
                activePlotId: activePlotId || initialPlots[0]._id,
                plots: initialPlots
            });
            return res.status(200).json({ success: true, profile: farm });
        }

        const updates = {};
        if (farmerName !== undefined) updates.farmerName = String(farmerName).trim();
        if (state !== undefined) updates.state = String(state).trim();
        if (district !== undefined) updates.district = String(district).trim();
        if (preferredLanguage !== undefined) updates.preferredLanguage = String(preferredLanguage).trim();
        if (activePlotId !== undefined) updates.activePlotId = String(activePlotId).trim();

        const updated = await Farm.findByIdAndUpdate(farm._id, updates, { new: true });
        const activePlot = updated.plots.find(p => p._id === updated.activePlotId) || updated.plots[0];

        return res.status(200).json({
            success: true,
            profile: updated,
            activePlot
        });
    } catch (error) {
        console.error("Error updating farm profile:", error);
        return res.status(500).json({ error: "Failed to update farm profile" });
    }
};

export const addPlot = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, area, areaUnit, crop, variety, sowingDate, growthStage, soilType, irrigationMethod } = req.body;

        if (!name || !crop) {
            return res.status(400).json({ error: "Plot name and crop are required" });
        }

        let farm = await Farm.findOne({ userId });
        if (!farm) {
            farm = await Farm.create({
                userId,
                farmerName: req.user.name,
                phone: req.user.phoneno || "",
                state: "Maharashtra",
                district: "Pune",
                preferredLanguage: "en",
                plots: []
            });
        }

        const newPlot = {
            _id: crypto.randomBytes(8).toString("hex"),
            name: String(name).trim(),
            area: Math.max(0.1, Number(area) || 1.0),
            areaUnit: areaUnit === "Hectares" ? "Hectares" : "Acres",
            crop: String(crop).trim(),
            variety: variety ? String(variety).trim() : "Standard Variety",
            sowingDate: sowingDate || new Date().toISOString().split("T")[0],
            growthStage: growthStage || "Vegetative",
            soilType: soilType || "Loamy",
            irrigationMethod: irrigationMethod || "Drip Irrigation",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const updatedPlots = [...(farm.plots || []), newPlot];
        const updated = await Farm.findByIdAndUpdate(
            farm._id,
            { plots: updatedPlots, activePlotId: farm.activePlotId || newPlot._id },
            { new: true }
        );

        return res.status(201).json({
            success: true,
            plot: newPlot,
            profile: updated
        });
    } catch (error) {
        console.error("Error adding farm plot:", error);
        return res.status(500).json({ error: "Failed to add plot" });
    }
};

export const updatePlot = async (req, res) => {
    try {
        const userId = req.user._id;
        const { plotId } = req.params;
        const { name, area, areaUnit, crop, variety, sowingDate, growthStage, soilType, irrigationMethod } = req.body;

        const farm = await Farm.findOne({ userId });
        if (!farm) return res.status(404).json({ error: "Farm profile not found" });

        const plotIndex = (farm.plots || []).findIndex(p => p._id === plotId);
        if (plotIndex === -1) {
            return res.status(404).json({ error: "Plot not found" });
        }

        const existingPlot = farm.plots[plotIndex];
        const updatedPlot = {
            ...existingPlot,
            name: name !== undefined ? String(name).trim() : existingPlot.name,
            area: area !== undefined ? Math.max(0.1, Number(area) || existingPlot.area) : existingPlot.area,
            areaUnit: areaUnit !== undefined ? areaUnit : existingPlot.areaUnit,
            crop: crop !== undefined ? String(crop).trim() : existingPlot.crop,
            variety: variety !== undefined ? String(variety).trim() : existingPlot.variety,
            sowingDate: sowingDate !== undefined ? sowingDate : existingPlot.sowingDate,
            growthStage: growthStage !== undefined ? growthStage : existingPlot.growthStage,
            soilType: soilType !== undefined ? soilType : existingPlot.soilType,
            irrigationMethod: irrigationMethod !== undefined ? irrigationMethod : existingPlot.irrigationMethod,
            updatedAt: new Date().toISOString()
        };

        farm.plots[plotIndex] = updatedPlot;
        const updated = await Farm.findByIdAndUpdate(farm._id, { plots: farm.plots }, { new: true });

        return res.status(200).json({
            success: true,
            plot: updatedPlot,
            profile: updated
        });
    } catch (error) {
        console.error("Error updating plot:", error);
        return res.status(500).json({ error: "Failed to update plot" });
    }
};

export const deletePlot = async (req, res) => {
    try {
        const userId = req.user._id;
        const { plotId } = req.params;

        const farm = await Farm.findOne({ userId });
        if (!farm) return res.status(404).json({ error: "Farm profile not found" });

        if (farm.plots.length <= 1) {
            return res.status(400).json({ error: "You must keep at least one field plot configured" });
        }

        const remainingPlots = farm.plots.filter(p => p._id !== plotId);
        const newActiveId = farm.activePlotId === plotId ? remainingPlots[0]._id : farm.activePlotId;

        const updated = await Farm.findByIdAndUpdate(
            farm._id,
            { plots: remainingPlots, activePlotId: newActiveId },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            profile: updated
        });
    } catch (error) {
        console.error("Error deleting plot:", error);
        return res.status(500).json({ error: "Failed to delete plot" });
    }
};
