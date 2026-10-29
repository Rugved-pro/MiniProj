import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";

function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

export const uploadBlobToCloudinary = async (imageUrl) => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
        }
        const blob = await response.blob();

        // Compressing the image
        const compressedBlob = await imageCompression(blob, {
            maxSizeMB: 10,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
        });

        const base64DataUrl = await blobToDataURL(compressedBlob);

        // Upload to local backend server first so it works 100% locally
        try {
            const localRes = await fetch(`${apiUrl}/upload-image`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ image: base64DataUrl })
            });
            if (localRes.ok) {
                const localData = await localRes.json();
                if (localData?.secure_url) {
                    return localData.secure_url;
                }
            }
        } catch (localErr) {
            console.warn("Local image upload failed, trying Cloudinary:", localErr);
        }

        const url = "https://api.cloudinary.com/v1_1/dhjyjsyvt/image/upload";
        const uploadPreset = "KisanSahayak2";
        const formData = new FormData();
        formData.append("upload_preset", uploadPreset);
        formData.append("file", compressedBlob);

        const res = await fetch(url, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        if (res.ok && data?.secure_url) {
            return data.secure_url;
        }
        return base64DataUrl;
    } catch (error) {
        console.error("Error uploading image: ", error);
        toast.error("Couldn't upload image");
        return null;
    }
};
