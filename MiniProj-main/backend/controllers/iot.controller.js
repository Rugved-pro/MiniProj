import Farm from "../models/farm.model.js";

// Ceres Field Health & IoT Telemetry Controller
// Supports Deterministic Demo Simulation, Farmer Manual Observation, and Hardware Webhook

const DEMO_SCENARIOS = {
    normal: {
        soilMoisture: 46.0,
        temperature: 24.2,
        humidity: 58.0,
        lightLux: 720,
        batteryVoltage: 4.15,
        batteryPercent: 93,
        rainfall: 0,
        scenarioKey: "normal",
        scenarioLabel: "Normal Conditions",
        alert: {
            title: "Optimal Growing Conditions",
            whatIsHappening: "Soil moisture and weather conditions are well balanced for healthy crop growth.",
            whyItMatters: "Roots have consistent access to water and oxygen without waterlogging or dryness stress.",
            whatFarmerShouldDo: "Continue standard monitoring. No irrigation or emergency interventions required today."
        }
    },
    low_moisture: {
        soilMoisture: 21.5,
        temperature: 31.0,
        humidity: 42.0,
        lightLux: 840,
        batteryVoltage: 4.05,
        batteryPercent: 90,
        rainfall: 0,
        scenarioKey: "low_moisture",
        scenarioLabel: "Low Soil Moisture — Irrigation Warning",
        alert: {
            title: "Your soil may need water",
            whatIsHappening: "Soil moisture in the root zone has dropped to 21.5%, which is below the safe threshold.",
            whyItMatters: "Crop roots cannot take up water quickly enough during warm daytime hours, leading to wilting and slowed nutrient uptake.",
            whatFarmerShouldDo: "Schedule light irrigation today, preferably early morning or late afternoon when evaporation is lowest."
        }
    },
    high_humidity: {
        soilMoisture: 31.0,
        temperature: 28.4,
        humidity: 82.0,
        lightLux: 650,
        batteryVoltage: 4.08,
        batteryPercent: 91,
        rainfall: 2.5,
        scenarioKey: "high_humidity",
        scenarioLabel: "High Humidity — Possible Fungal-Risk Warning",
        alert: {
            title: "Current weather conditions may favour fungal disease",
            whatIsHappening: "Air humidity has remained high at 82% with canopy temperature at 28.4°C.",
            whyItMatters: "Prolonged leaf dampness and warm ambient air create ideal conditions for fungal spores to germinate and spread.",
            whatFarmerShouldDo: "Inspect lower foliage for discolored lesions or powdery spots during morning walks; avoid overhead sprinkling."
        }
    },
    high_temperature: {
        soilMoisture: 25.8,
        temperature: 38.6,
        humidity: 33.0,
        lightLux: 950,
        batteryVoltage: 3.98,
        batteryPercent: 88,
        rainfall: 0,
        scenarioKey: "high_temperature",
        scenarioLabel: "High Temperature — Heat-Stress Warning",
        alert: {
            title: "Midday Heat Stress Warning",
            whatIsHappening: "Field temperature has reached 38.6°C with intense solar radiation (950 lux).",
            whyItMatters: "Excessive heat causes rapid water loss through transpiration, causing temporary wilting and reduced photosynthesis.",
            whatFarmerShouldDo: "Avoid spraying fertilizers or agrochemicals during peak midday hours; ensure soil has sufficient moisture or mulch."
        }
    }
};

// In-memory latest manual readings per user
const manualTelemetryStore = new Map();

// Hardware telemetry store (can receive data from ESP32 / webhook)
let hardwareTelemetryState = {
    connected: false,
    lastSeen: null,
    soilMoisture: null,
    temperature: null,
    humidity: null,
    lightLux: null,
    rainfall: null,
    batteryVoltage: null
};

export const getFieldReadings = async (req, res) => {
    try {
        const { mode = "simulated", scenario = "high_humidity" } = req.query;
        const userId = req.user?._id;

        let farm = null;
        if (userId) {
            farm = await Farm.findOne({ userId });
        }
        const activePlot = farm?.plots?.find(p => p._id === farm?.activePlotId) || farm?.plots?.[0];
        const cropName = activePlot?.crop || "Wheat";
        const soilType = activePlot?.soilType || "Loamy";

        let readings = null;

        if (mode === "hardware") {
            if (hardwareTelemetryState.connected && hardwareTelemetryState.soilMoisture !== null) {
                readings = {
                    mode: "HARDWARE",
                    deviceStatus: "ESP32 — HARDWARE ONLINE",
                    isHardware: true,
                    isSimulated: false,
                    connectionStatus: "ONLINE",
                    lastUpdated: hardwareTelemetryState.lastSeen || new Date().toISOString(),
                    soilMoisture: hardwareTelemetryState.soilMoisture,
                    temperature: hardwareTelemetryState.temperature,
                    humidity: hardwareTelemetryState.humidity,
                    lightLux: hardwareTelemetryState.lightLux || 650,
                    rainfall: hardwareTelemetryState.rainfall || 0,
                    batteryVoltage: hardwareTelemetryState.batteryVoltage || 3.9,
                    batteryPercent: 85
                };
            } else {
                readings = {
                    mode: "HARDWARE",
                    deviceStatus: "ESP32 — HARDWARE OFFLINE",
                    isHardware: true,
                    isSimulated: false,
                    connectionStatus: "OFFLINE",
                    lastUpdated: hardwareTelemetryState.lastSeen || null,
                    message: "No active physical ESP32 sensor detected. Connect your field node or switch to Demo Simulation / Manual mode."
                };
            }
        } else if (mode === "manual") {
            const stored = userId ? manualTelemetryStore.get(String(userId)) : null;
            if (stored) {
                readings = {
                    mode: "MANUAL",
                    deviceStatus: "MANUAL OBSERVATION",
                    isHardware: false,
                    isSimulated: false,
                    connectionStatus: "MANUAL_ENTRY",
                    lastUpdated: stored.timestamp,
                    soilMoisture: stored.soilMoisture,
                    temperature: stored.temperature,
                    humidity: stored.humidity,
                    lightLux: stored.lightLux || 600,
                    rainfall: stored.rainfall || 0,
                    batteryVoltage: null,
                    batteryPercent: null,
                    soilBallFeel: stored.soilBallFeel || "Moist"
                };
            } else {
                readings = {
                    mode: "MANUAL",
                    deviceStatus: "NO MANUAL DATA",
                    isHardware: false,
                    isSimulated: false,
                    connectionStatus: "NO_MANUAL_DATA",
                    lastUpdated: null,
                    message: "No manual observations recorded yet. Enter today's field observations."
                };
            }
        } else {
            // Simulated demonstration data
            const scenarioConfig = DEMO_SCENARIOS[scenario] || DEMO_SCENARIOS.high_humidity;
            const now = new Date();

            readings = {
                mode: "SIMULATION",
                deviceStatus: "ESP32 — DEMO MODE",
                isHardware: false,
                isSimulated: true,
                connectionStatus: "SIMULATED_DEMO",
                lastUpdated: now.toISOString(),
                scenario: scenarioConfig.scenarioKey,
                scenarioLabel: scenarioConfig.scenarioLabel,
                soilMoisture: scenarioConfig.soilMoisture,
                temperature: scenarioConfig.temperature,
                humidity: scenarioConfig.humidity,
                lightLux: scenarioConfig.lightLux,
                batteryVoltage: scenarioConfig.batteryVoltage,
                batteryPercent: scenarioConfig.batteryPercent,
                rainfall: scenarioConfig.rainfall,
                disclaimer: "SIMULATED DATA — Demonstration values, NOT real sensor readings."
            };
        }

        // Generate explainable farmer-friendly interpretation
        let advisory = null;
        if (readings && readings.soilMoisture !== undefined && readings.connectionStatus !== "OFFLINE") {
            advisory = generateFarmerAdvisory(
                readings.soilMoisture,
                readings.temperature,
                readings.humidity,
                readings.rainfall,
                cropName,
                soilType,
                scenario
            );
        }

        return res.status(200).json({
            success: true,
            crop: cropName,
            plot: activePlot?.name || "Main Field",
            readings,
            advisory,
            scenarios: Object.keys(DEMO_SCENARIOS).map(k => ({
                key: k,
                label: DEMO_SCENARIOS[k].scenarioLabel
            }))
        });
    } catch (error) {
        console.error("Error fetching field readings:", error);
        return res.status(500).json({ error: "Failed to load field readings" });
    }
};

export const submitManualReading = async (req, res) => {
    try {
        const userId = req.user._id;
        const { soilMoisture, temperature, humidity, rainfall, lightLux, soilBallFeel } = req.body;

        const record = {
            soilMoisture: Number(soilMoisture) || 40,
            temperature: Number(temperature) || 28,
            humidity: Number(humidity) || 60,
            lightLux: Number(lightLux) || 650,
            rainfall: Number(rainfall) || 0,
            soilBallFeel: soilBallFeel || "Moist ball, does not crumble",
            timestamp: new Date().toISOString()
        };

        manualTelemetryStore.set(String(userId), record);

        return res.status(200).json({
            success: true,
            message: "Manual field observation recorded successfully",
            reading: record
        });
    } catch (error) {
        console.error("Error submitting manual reading:", error);
        return res.status(500).json({ error: "Failed to record manual reading" });
    }
};

export const ingestHardwareWebhook = async (req, res) => {
    try {
        const { soilMoisture, temperature, humidity, rainfall, lightLux, batteryVoltage } = req.body;

        hardwareTelemetryState = {
            connected: true,
            lastSeen: new Date().toISOString(),
            soilMoisture: Number(soilMoisture),
            temperature: Number(temperature),
            humidity: Number(humidity),
            lightLux: Number(lightLux || 650),
            rainfall: Number(rainfall || 0),
            batteryVoltage: Number(batteryVoltage || 4.0)
        };

        return res.status(200).json({ success: true, message: "Telemetry ingested" });
    } catch (error) {
        console.error("Error ingesting hardware webhook:", error);
        return res.status(500).json({ error: "Failed to ingest telemetry" });
    }
};

// Conversational, farmer-friendly advisory generator with 3-part structured alerts
function generateFarmerAdvisory(moisture, temp, hum, rain, crop, soil, scenarioKey) {
    // Soil moisture status
    let moistureStatus = "Good";
    let moistureExplanation = "Your soil has comfortable moisture for healthy root water uptake.";
    let waterAction = "No irrigation required today.";
    let nextCheck = "Check again tomorrow morning.";

    if (moisture < 28) {
        moistureStatus = "Low";
        moistureExplanation = "The root zone is drying out. Plants may experience water stress if sunshine is strong.";
        waterAction = "Schedule light irrigation today, preferably early morning or late afternoon.";
        nextCheck = "Check soil moisture immediately after watering.";
    } else if (moisture > 65) {
        moistureStatus = "High";
        moistureExplanation = "Soil is near saturation. Excess water can restrict oxygen to crop roots.";
        waterAction = "Hold off on all watering and inspect field drainage channels.";
        nextCheck = "Check again in 2 days to confirm moisture is dropping naturally.";
    }

    // Heat stress
    let tempStatus = "Normal";
    let tempExplanation = "Temperatures are within comfortable range for plant metabolism.";
    if (temp > 35) {
        tempStatus = "Heat Stress Risk";
        tempExplanation = `Air temperature is ${temp}°C. Leaves lose water faster through transpiration during midday heat.`;
    } else if (temp < 15) {
        tempStatus = "Cold Slowdown";
        tempExplanation = `Cool conditions (${temp}°C) may temporarily slow vegetative growth.`;
    }

    // Humidity & Fungal Risk
    let humidityStatus = "Comfortable";
    let humidityExplanation = "Air humidity is moderate.";
    let fungalRisk = "Low";
    if (hum > 75) {
        humidityStatus = "High Moisture in Air";
        humidityExplanation = "Prolonged high humidity keeps foliage damp.";
        fungalRisk = "Current weather conditions may favour fungal disease";
    }

    // Construct 3-part explainable alerts for farmers
    const alerts = [];

    if (scenarioKey && DEMO_SCENARIOS[scenarioKey]?.alert) {
        const scenarioAlert = DEMO_SCENARIOS[scenarioKey].alert;
        alerts.push({
            level: scenarioKey === "normal" ? "success" : "warning",
            title: scenarioAlert.title,
            whatIsHappening: scenarioAlert.whatIsHappening,
            whyItMatters: scenarioAlert.whyItMatters,
            whatFarmerShouldDo: scenarioAlert.whatFarmerShouldDo
        });
    } else {
        if (moisture < 28) {
            alerts.push({
                level: "warning",
                title: "Your soil may need water",
                whatIsHappening: `Soil moisture in the root zone is low at ${moisture}%.`,
                whyItMatters: "Water stress prevents root absorption and causes plant wilting under sun.",
                whatFarmerShouldDo: "Run light irrigation early morning or late afternoon."
            });
        }
        if (hum > 75) {
            alerts.push({
                level: "warning",
                title: "Current weather conditions may favour fungal disease",
                whatIsHappening: `Air humidity is high at ${hum}% with warm foliage temperature.`,
                whyItMatters: "Moist leaves provide ideal conditions for fungal spores to germinate.",
                whatFarmerShouldDo: "Inspect lower leaves for spots and avoid overhead watering."
            });
        }
        if (temp > 35) {
            alerts.push({
                level: "warning",
                title: "Midday Heat Stress Warning",
                whatIsHappening: `Air temperature has risen to ${temp}°C.`,
                whyItMatters: "Rapid transpiration causes dehydration and reduces yield potential.",
                whatFarmerShouldDo: "Avoid foliar spraying during peak afternoon heat; ensure root-zone moisture."
            });
        }
    }

    return {
        soilMoisture: {
            value: moisture,
            status: moistureStatus,
            friendlyLabel: "How wet is your soil?",
            explanation: moistureExplanation
        },
        temperature: {
            value: temp,
            status: tempStatus,
            friendlyLabel: "Air Temperature",
            explanation: tempExplanation
        },
        humidity: {
            value: hum,
            status: humidityStatus,
            friendlyLabel: "Moisture in the air",
            explanation: humidityExplanation,
            pathogenNotice: fungalRisk
        },
        irrigationAdvice: {
            action: waterAction,
            reason: `Based on ${crop} in ${soil} soil with current soil moisture of ${moisture}% and ${temp}°C temperature.`,
            nextCheckTime: nextCheck
        },
        alerts
    };
}
