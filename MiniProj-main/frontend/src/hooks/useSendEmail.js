import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const useSendEmail = () => {
    const [loading, setLoading] = useState(false);
    const { authUser } = useAuthContext();

    const email = async ({ mail, message }) => {
        const success = handleInputErrors({ mail, message });
        if (!success) return;

        setLoading(true);
        try {
            const data = {
                service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
                template_id: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                user_id: import.meta.env.VITE_EMAILJS_USER_ID,
                template_params: {
                    from_name: authUser?.name || "Visitor",
                    from_email: mail,
                    to_name: "Ceres Support",
                    message: message
                }
            };

            const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                toast.success("Feedback submitted to Ceres Support.");
            } else {
                toast.error("Could not send message. Please try again later.");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };
    return { loading, email };
};

export default useSendEmail;

function handleInputErrors({ mail, message }) {
    if (!mail || !message) {
        toast.error("Please fill in all fields");
        return false;
    }
    return true;
}
