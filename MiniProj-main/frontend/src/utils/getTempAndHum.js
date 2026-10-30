import { fetchIPInfo } from "./getLocationAndWeatherData";

const key = import.meta.env.VITE_API_KEY;

async function fetchOpenMeteo(lat, lon) {
    try {
        const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m&forecast_days=1`
        );
        if (res.ok) {
            const data = await res.json();
            const temps = data?.hourly?.temperature_2m || [];
            const hums = data?.hourly?.relative_humidity_2m || [];
            if (temps.length > 0 && hums.length > 0) {
                const avgTempC = temps.reduce((s, t) => s + t, 0) / temps.length;
                const avgHum = hums.reduce((s, h) => s + h, 0) / hums.length;
                return {
                    avgTemp: Number((avgTempC + 273.15).toFixed(2)),
                    avgHum: Number(avgHum.toFixed(2))
                };
            }
        }
    } catch {
        // Fallback below
    }
    return { avgTemp: 301.15, avgHum: 68 };
}

export const getTempAndHum = async () => {
    try {
        const weatherData = await fetchIPInfo();
        const lat = weatherData?.lat || 18.5204;
        const lon = weatherData?.lon || 73.8567;

        if (key) {
            const res = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`
            );
            const data = await res.json();
            if (Array.isArray(data?.list) && data.list.length > 0) {
                const tempVals = data.list.map((el) => el.main.temp);
                const humVals = data.list.map((el) => el.main.humidity);
                const avgTemp = tempVals.reduce((sum, temp) => sum + temp, 0) / tempVals.length;
                const avgHum = humVals.reduce((sum, hum) => sum + hum, 0) / humVals.length;
                return { avgTemp, avgHum };
            }
        }

        return await fetchOpenMeteo(lat, lon);
    } catch {
        return { avgTemp: 301.15, avgHum: 68 };
    }
};

export const getRegionalTempAndHum = async (district) => {
    try {
        if (key) {
            const geoUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(district)}&limit=1&appid=${key}`;
            const response = await fetch(geoUrl);
            const resData = await response.json();
            if (Array.isArray(resData) && resData.length > 0) {
                const { lat, lon } = resData[0];
                const res = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}`
                );
                const data = await res.json();
                if (Array.isArray(data?.list) && data.list.length > 0) {
                    const tempVals = data.list.map((el) => el.main.temp);
                    const humVals = data.list.map((el) => el.main.humidity);
                    const avgTemp = tempVals.reduce((sum, temp) => sum + temp, 0) / tempVals.length;
                    const avgHum = humVals.reduce((sum, hum) => sum + hum, 0) / humVals.length;
                    return { avgTemp, avgHum };
                }
            }
        }

        const geoRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(district)}&count=1`
        );
        if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (Array.isArray(geoData?.results) && geoData.results.length > 0) {
                const { latitude, longitude } = geoData.results[0];
                return await fetchOpenMeteo(latitude, longitude);
            }
        }

        return await fetchOpenMeteo(18.5204, 73.8567);
    } catch {
        return { avgTemp: 301.15, avgHum: 68 };
    }
};