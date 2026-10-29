import { useState } from "react";
import toast from "react-hot-toast";
import { validateAndFormatDate } from "../utils/dateValidator";
import { useAuthContext } from "../context/AuthContext";

const useSignup = () => {
	const [loading, setLoading] = useState(false);
	const { setAuthUser } = useAuthContext();
	const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

	const signup = async ({ name, phoneno, day, month, year, password, gender, crops }) => {
		const dob = validateAndFormatDate(day, month, year);
		if (!handleInputErrors({ name, phoneno, day, month, year, password, gender, crops, dob })) {
			return false;
		}

		setLoading(true);
		try {
			const res = await fetch(`${apiUrl}/auth/register`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					name: name.trim(),
					phoneno,
					dob,
					password,
					gender,
					crops
				})
			});

			const contentType = res.headers.get("content-type") || "";
			if (!contentType.includes("application/json")) {
				throw new Error("The backend returned an unexpected response. Check that the backend is running.");
			}

			const data = await res.json();
			if (!res.ok || data.error) {
				throw new Error(data.error || "Signup failed. Please try again.");
			}

			localStorage.setItem("KS-token", data.token);
			localStorage.setItem("KS-user", JSON.stringify(data));
			setAuthUser(data);
			toast.success("Account created successfully!");
			return true;
		} catch (error) {
			toast.error(error.message);
			return false;
		} finally {
			setLoading(false);
		}
	};

	return { loading, signup };
};

export default useSignup;

function handleInputErrors({ name, phoneno, day, month, year, password, gender, crops, dob }) {
	if (!name || !phoneno || !day || !month || !year || !password || !gender || !crops) {
		toast.error("Please fill all the fields");
		return false;
	}

	if (phoneno.length !== 10) {
		toast.error("Enter a valid 10-digit mobile number");
		return false;
	}

	if (password.length < 6) {
		toast.error("Password should be at least 6 characters long");
		return false;
	}

	if (crops.length < 1) {
		toast.error("At least one crop should be specified to proceed");
		return false;
	}

	if (!dob) {
		toast.error("Enter a valid Date of Birth");
		return false;
	}

	return true;
}
