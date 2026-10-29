import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { client } from "../redis/client.js";

const DEFAULT_JWT_SECRET = "kisansahayak_local_jwt_secret_2026";

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized - No Token Provided" });
        }

        const decodedUser = jwt.verify(token, process.env.JWT_SECRET || DEFAULT_JWT_SECRET);
        if (!decodedUser) {
            return res.status(401).json({ error: "Unauthorized - Invalid Token" });
        }

        const user = await User.findById(decodedUser.userId).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User Not Found!" });
        }

        const redisKey = `user:${decodedUser.userId}`;
        const payload = await client.get(redisKey);
        if (!payload) {
            await client.set(redisKey, JSON.stringify({ ...user, token }));
            await client.expire(redisKey, 30 * 24 * 60 * 60);
        }

        req.user = user;
        next();
    } catch (err) {
        console.log("Error in verifyToken middleware", err.message);
        res.status(401).json({ error: "Unauthorized - Invalid or Expired Token" });
    }
};

export default verifyToken;