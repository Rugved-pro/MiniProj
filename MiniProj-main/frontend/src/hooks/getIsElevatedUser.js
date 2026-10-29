import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";

const useGetIsElevatedUser = () => {
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const { authUser } = useAuthContext();

    const isElevatedUser = async () => {
        if (!authUser?._id) return false;
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/elevatedUser/isElevatedUser/${authUser._id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("KS-token")}`,
                }
            });
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return Boolean(data.elevatedUser);
        } catch (error) {
            console.log(error);
            return false;
        } finally {
            setLoading(false);
        }
    };
    return { loading, isElevatedUser };
};

export default useGetIsElevatedUser;