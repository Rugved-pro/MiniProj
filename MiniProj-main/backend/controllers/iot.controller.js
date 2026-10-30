import Farm from "../models/farm.model.js";

// In-memory latest manual readings per user
const manualTelemetryStore = new Map();

// Hardware telemetry store (can receive data from ESP32 / webhook)
let hardwareTelemetryState = {
    connected: false,
    lastSeen: null,
    soilMoisture: null,
    temperature: null,
    humidity: null,
    rainfall: null,
    batteryVoltage: null
};

export const getFieldReadings = async (req, res) => {
    try {
        const { mode = "simulated" } = req.query;
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
                    isHardware: true,
                    isSimulated: false,
                    connectionStatus: "ONLINE",
                    lastUpdated: hardwareTelemetryState.lastSeen || new Date().toISOString(),
                    soilMoisture: hardwareTelemetryState.soilMoisture,
                    temperature: hardwareTelemetryState.temperature,
                    humidity: hardwareTelemetryState.humidity,
                    rainfall: hardwareTelemetryState.rainfall || 0,
                    batteryVoltage: hardwareTelemetryState.batteryVoltage || 3.9
                };
            } else {
                readings = {
                    mode: "HARDWARE",
                    isHardware: true,
                    isSimulated: false,
                    connectionStatus: "OFFLINE",
                    lastUpdated: hardwareTelemetryState.lastSeen || null,
                    message: "No active physical ESP32 sensor detected. Connect your field node or switch to Manual / Demo mode."
                };
            }
        } else if (mode === "manual") {
            const stored = userId ? manualTelemetryStore.get(userId) : null;
            if (stored) {
                readings = {
                    mode: "MANUAL",
                    isHardware: false,
                    isSimulated: false,
                    connectionStatus: "MANUAL_ENTRY",
                    lastUpdated: stored.timestamp,
                    soilMoisture: stored.soilMoisture,
                    temperature: stored.temperature,
                    humidity: stored.humidity,
                    rainfall: stored.rainfall || 0,
                    soilBallFeel: stored.soilBallFeel || "Moist"
                };
            } else {
                readings = {
                    mode: "MANUAL",
                    isHardware: false,
                    isSimulated: false,
                    connectionStatus: "NO_MANUAL_DATA",
                    lastUpdated: null,
                    message: "No manual readings entered yet. Enter today's soil moisture and weather observations."
                };
            }
        } else {
            // Realistic simulated demonstration data based on time of day
            const now = new Date();
            const hour = now.getHours();
            // Temperature diurnal curve: cooler in early morning (21C), warmer at 2pm (31C)
            const baseTemp = 25 + 5 * Math.sin((hour - 8) * (Math.PI / 12));
            const baseHumidity = 65 - 15 * Math.sin((hour - 8) * (Math.PI / 12));
            const baseMoisture = 38 + 4 * Math.cos(hour * (Math.PI / 12));

            readings = {
                mode: "SIMULATION",
                isHardware: false,
                isSimulated: true,
                connectionStatus: "SIMULATED_DEMO",
                lastUpdated: now.toISOString(),
                soilMoisture: Math.round(baseMoisture * 10) / 10,
                temperature: Math.round(baseTemp * 10) / 10,
                humidity: Math.round(baseHumidity * 10) / 10,
                rainfall: 0,
                batteryVoltage: 4.1,
                disclaimer: "Demonstration Data. Not a live physical sensor reading."
            };
        }

        // Generate explainable farmer-friendly interpretation if metrics are present
        let advisory = null;
        if (readings && readings.soilMoisture !== undefined) {
            advisory = generateFarmerAdvisory(
                readings.soilMoisture,
                readings.temperature,
                readings.humidity,
                readings.rainfall,
                cropName,
                soilType
            );
        }

        return res.status(200).json({
            success: true,
            crop: cropName,
            plot: activePlot?.name || "Main Field",
            readings,
            advisory
        });
    } catch (error) {
        console.error("Error fetching field readings:", error);
        return res.status(500).json({ error: "Failed to load field readings" });
    }
};

export const submitManualReading = async (req, res) => {
    try {
        const userId = req.user._id;
        const { soilMoisture, temperature, humidity, rainfall, soilBallFeel } = req.body;

        const record = {
            soilMoisture: Number(soilMoisture) || 40,
            temperature: Number(temperature) || 28,
            humidity: Number(humidity) || 60,
            rainfall: Number(rainfall) || 0,
            soilBallFeel: soilBallFeel || "Moist ball, does not crumble",
            timestamp: new Date().toISOString()
        };

        manualTelemetryStore.set(userId, record);

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
        const { soilMoisture, temperature, humidity, rainfall, batteryVoltage } = req.body;

        hardwareTelemetryState = {
            connected: true,
            lastSeen: new Date().toISOString(),
            soilMoisture: Number(soilMoisture),
            temperature: Number(temperature),
            humidity: Number(humidity),
            rainfall: Number(rainfall || 0),
            batteryVoltage: Number(batteryVoltage || 4.0)
        };

        return res.status(200).json({ success: true, message: "Telemetry ingested" });
    } catch (error) {
        console.error("Error ingesting hardware webhook:", error);
        return res.status(500).json({ error: "Failed to ingest telemetry" });
    }
};

// Conversational, non-technical farmer advisory helper
function generateFarmerAdvisory(moisture, temp, hum, rain, crop, soil) {
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
    } else if (temp < 12) {
        tempStatus = "Cold Slowdown";
        tempExplanation = `Cool conditions (${temp}°C) may temporarily slow vegetative growth.`;
    }

    // Humidity & Fungal Risk
    let humidityStatus = "Comfortable";
    let humidityExplanation = "Air humidity is moderate.";
    let fungalRisk = "Low";
    if (hum > 78) {
        humidityStatus = "High Moisture in Air";
        humidityExplanation = "Prolonged high humidity keeps foliage damp.";
        fungalRisk = "Weather may favour fungal leaf spots";
    }

    // Conversational alerts
    const alerts = [];
    if (moisture < 28) {
        alerts.push({
            level: "warning",
            title: "Your soil may need water",
            message: `Soil moisture is at ${moisture}%. Check moisture near the roots before running pumps.`
        });
    }
    if (hum > 78) {
        alerts.push({
            level: "info",
            title: "Weather may favour fungal spots",
            message: `Humidity has reached ${hum}%. Inspect lower crop leaves for unusual rust or dark spots during your morning field walk.`
        });
    }
    if (temp > 35) {
        alerts.push({
            level: "warning",
            title: "High midday heat",
            message: "Avoid foliar spraying during peak afternoon heat to prevent leaf scorching."
        });
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
