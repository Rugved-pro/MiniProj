import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuthContext } from "./AuthContext";
import toast from "react-hot-toast";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const FarmContext = createContext();

export const useFarmContext = () => {
    return useContext(FarmContext);
};

export const FarmContextProvider = ({ children }) => {
    const { authUser } = useAuthContext();
    const [farmProfile, setFarmProfile] = useState(null);
    const [activePlot, setActivePlot] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchFarmProfile = useCallback(async () => {
        if (!authUser) {
            setFarmProfile(null);
            setActivePlot(null);
            return;
        }

        setLoading(true);
        try {
            const token = authUser.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/farm/profile`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.profile) {
                    setFarmProfile(data.profile);
                    setActivePlot(data.activePlot || data.profile.plots?.[0] || null);
                }
            }
        } catch (error) {
            console.warn("Could not fetch farm profile:", error.message);
        } finally {
            setLoading(false);
        }
    }, [authUser]);

    useEffect(() => {
        fetchFarmProfile();
    }, [fetchFarmProfile]);

    const switchPlot = async (plotId) => {
        if (!farmProfile) return;
        const target = farmProfile.plots?.find(p => p._id === plotId);
        if (target) {
            setActivePlot(target);
            try {
                const token = authUser?.token || localStorage.getItem("token");
                await fetch(`${API_BASE}/farm/profile`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({ activePlotId: plotId })
                });
            } catch (err) {
                console.warn("Could not sync active plot:", err);
            }
        }
    };

    const updateProfile = async (profileData) => {
        try {
            const token = authUser?.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/farm/profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(profileData)
            });

            const data = await res.json();
            if (res.ok && data.profile) {
                setFarmProfile(data.profile);
                if (data.activePlot) setActivePlot(data.activePlot);
                toast.success("Farm profile updated successfully");
                return true;
            } else {
                toast.error(data.error || "Failed to update profile");
                return false;
            }
        } catch (err) {
            toast.error("Network error updating profile");
            return false;
        }
    };

    const addPlot = async (plotData) => {
        try {
            const token = authUser?.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/farm/plots`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(plotData)
            });

            const data = await res.json();
            if (res.ok && data.profile) {
                setFarmProfile(data.profile);
                if (data.plot) setActivePlot(data.plot);
                toast.success(`Plot "${plotData.name}" added successfully`);
                return true;
            } else {
                toast.error(data.error || "Failed to add plot");
                return false;
            }
        } catch (err) {
            toast.error("Network error adding plot");
            return false;
        }
    };

    const updatePlot = async (plotId, plotData) => {
        try {
            const token = authUser?.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/farm/plots/${plotId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(plotData)
            });

            const data = await res.json();
            if (res.ok && data.profile) {
                setFarmProfile(data.profile);
                if (data.plot && activePlot?._id === plotId) setActivePlot(data.plot);
                toast.success("Plot details updated");
                return true;
            } else {
                toast.error(data.error || "Failed to update plot");
                return false;
            }
        } catch (err) {
            toast.error("Network error updating plot");
            return false;
        }
    };

    const deletePlot = async (plotId) => {
        try {
            const token = authUser?.token || localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/farm/plots/${plotId}`, {
                method: "DELETE",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            const data = await res.json();
            if (res.ok && data.profile) {
                setFarmProfile(data.profile);
                setActivePlot(data.profile.plots?.[0] || null);
                toast.success("Plot removed");
                return true;
            } else {
                toast.error(data.error || "Could not delete plot");
                return false;
            }
        } catch (err) {
            toast.error("Network error deleting plot");
            return false;
        }
    };

    return (
        <FarmContext.Provider
            value={{
                farmProfile,
                activePlot,
                plots: farmProfile?.plots || [],
                loading,
                switchPlot,
                updateProfile,
                addPlot,
                updatePlot,
                deletePlot,
                refreshFarm: fetchFarmProfile
            }}
        >
            {children}
        </FarmContext.Provider>
    );
};
