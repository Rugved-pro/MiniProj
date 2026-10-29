import { signJwt } from "./jwt.js";

const JWT_SECRET = process.env.JWT_SECRET || "kisansahayak_local_jwt_secret_2026";

const generateTokenAndSetCookie = async (userId, res) => {
    const token = await signJwt({ userId }, process.env.JWT_SECRET || JWT_SECRET, "30d");

    //Auth cookies
    res.cookie("jwt", token, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"
    });

    return token;
}

export default generateTokenAndSetCookie;