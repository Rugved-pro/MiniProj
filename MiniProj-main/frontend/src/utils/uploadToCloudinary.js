import toast from "react-hot-toast";

export const uploadToCloudinary = async (base64Image) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

    // Upload to local backend server first so it works 100% locally
    try {
        const localRes = await fetch(`${apiUrl}/upload-image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: base64Image })
        });
        if (localRes.ok) {
            const localData = await localRes.json();
            if (localData?.secure_url) {
                return localData.secure_url;
            }
        }
    } catch (err) {
        console.warn("Local image upload fallback to Cloudinary:", err);
    }

    const url = "https://api.cloudinary.com/v1_1/dhjyjsyvt/image/upload";
    const uploadPreset = "KisanSahayak2";

    const formData = new FormData();
    formData.append("file", base64Image);
    formData.append("upload_preset", uploadPreset);

    try {
        const res = await fetch(url, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        return data.secure_url || base64Image;
    } catch (error) {
        console.log("Error uploading image: ", error);
        toast.error("Couldn't upload image");
        return base64Image;
    }
};