import toast from "react-hot-toast";
import { env_data } from "../data/Rainfall_Soil.json";

const FALLBACK_IP_INFO = {
    city: "PUNE",
    lat: 18.5204,
    lon: 73.8567
};

const getLocationAndWeather = async () => {
    try {
        const res = await fetch('https://api.ipify.org');
        const data = await res.text();
        return data;
    } catch {
        return null;
    }
};

export const fetchIPInfo = async () => {
    try {
        const ip = await getLocationAndWeather();
        if (!ip) {
            return FALLBACK_IP_INFO;
        }

        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        if (data && data.city) {
            const existsInEnv = env_data.some(
                (item) => item.District.toUpperCase().trim() === data.city.toUpperCase().trim()
            );
            if (!existsInEnv) {
                return {
                    ...data,
                    city: FALLBACK_IP_INFO.city,
                    lat: data.lat || FALLBACK_IP_INFO.lat,
                    lon: data.lon || FALLBACK_IP_INFO.lon
                };
            }
            return data;
        }
        return FALLBACK_IP_INFO;
    } catch {
        return FALLBACK_IP_INFO;
    }
};

export const fetchWeatherInfo = async () => {
    const defaultDistrict =
        env_data.find((d) => d.District.toUpperCase() === "PUNE") || env_data[0];

    try {
        const district = await fetchIPInfo();

        if (district && district.city) {
            const matchedDistrict = env_data.find(
                (data) =>
                    data.District.toUpperCase().trim().normalize() ===
                    district.city.toUpperCase().trim().normalize()
            );

            if (matchedDistrict) {
                return matchedDistrict;
            }
        }
        return defaultDistrict;
    } catch {
        return defaultDistrict;
    }
};

export const getRegionalWeather = (district) => {
    const matchedDistrict = env_data.find(
        (data) => data.District.toUpperCase() === String(district || "").toUpperCase()
    );

    if (matchedDistrict) {
        return matchedDistrict;
    } else {
        toast.error(`No data found for the district: ${district}`);
        return env_data[0];
    }
};