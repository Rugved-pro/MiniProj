export const CROP_SOIL_RULES = {
    Wheat: {
        depletionFraction: 0.55,
        sourceCrop: "Spring/winter wheat",
        source: "FAO Irrigation and Drainage Paper 56, Table 22",
        note: "The reference depletion fraction is for ETc near 5 mm/day. Root depth must reflect this crop's current growth stage and soil."
    },
    Rice: {
        depletionFraction: 0.2,
        sourceCrop: "Rice",
        source: "FAO Irrigation and Drainage Paper 56, Table 22",
        note: "FAO reports this fraction relative to saturation. Paddy irrigation also depends on the water-management system and ponded water or field-tube level; soil moisture alone is not enough for a safe irrigation decision."
    },
    Potato: {
        depletionFraction: 0.35,
        sourceCrop: "Potato",
        source: "FAO Irrigation and Drainage Paper 56, Table 22",
        note: "The reference depletion fraction is for ETc near 5 mm/day. Root depth must reflect this crop's current growth stage and soil."
    },
    Corn: {
        depletionFraction: 0.55,
        sourceCrop: "Maize, field (grain)",
        source: "FAO Irrigation and Drainage Paper 56, Table 22",
        note: "The reference depletion fraction is for ETc near 5 mm/day. Root depth must reflect this crop's current growth stage and soil."
    }
};

export const FAO56_SOURCE_URL = "https://www.fao.org/4/x0490e/x0490e0e.htm";

export function getIrrigationAssessment({
    crop,
    moistureValue,
    moistureUnit,
    fieldCapacity,
    wiltingPoint,
    rootDepth,
    growthStage
}) {
    const rule = CROP_SOIL_RULES[crop];
    if (!rule) return { status: "unavailable", reason: "Select one of the supported crops." };
    if (crop === "Rice") {
        return {
            status: "unavailable",
            reason: "Rice management needs the system type and ponded-water depth or a field-tube reading. This dataset only has soil moisture, so a rice irrigation decision is not available."
        };
    }
    if (!growthStage) {
        return { status: "unavailable", reason: "Select the crop's current growth stage." };
    }
    if (!moistureUnit) {
        return { status: "unavailable", reason: "The moisture column has no verified unit. Select volumetric moisture only if your sensor or dataset documentation confirms it." };
    }
    if (!Number.isFinite(moistureValue)) {
        return { status: "unavailable", reason: "The latest row does not contain a numeric soil-moisture reading." };
    }
    if (!Number.isFinite(fieldCapacity) || !Number.isFinite(wiltingPoint) || !Number.isFinite(rootDepth)) {
        return { status: "unavailable", reason: "Enter soil field capacity, wilting point, and the effective root depth for the selected crop stage." };
    }
    if (wiltingPoint < 0 || fieldCapacity > 100 || wiltingPoint >= fieldCapacity) {
        return { status: "unavailable", reason: "Use valid volumetric values: 0 ≤ wilting point < field capacity ≤ 100%." };
    }
    if (rootDepth <= 0 || rootDepth > 3) {
        return { status: "unavailable", reason: "Enter a measured or locally recommended effective root depth between 0 and 3 metres." };
    }

    const currentMoisture = moistureUnit === "fraction" ? moistureValue * 100 : moistureValue;
    if (currentMoisture < 0 || currentMoisture > 100) {
        return { status: "unavailable", reason: "The reading is outside the 0–100% volumetric water-content range. Check sensor calibration and units." };
    }

    const totalAvailableWater = (fieldCapacity - wiltingPoint) * 10 * rootDepth;
    const depletion = Math.max(0, Math.min(totalAvailableWater, (fieldCapacity - currentMoisture) * 10 * rootDepth));
    const depletionFraction = depletion / totalAvailableWater;
    const thresholdMm = rule.depletionFraction * totalAvailableWater;

    return {
        status: depletionFraction >= rule.depletionFraction ? "irrigate" : "postpone",
        depletionFraction,
        allowedDepletionFraction: rule.depletionFraction,
        depletionMm: depletion,
        thresholdMm,
        totalAvailableWaterMm: totalAvailableWater,
        rule,
        currentMoisture
    };
}
