import { verifyJwt } from "../utils/jwt.js";
import Metadata from "../models/metadata.model.js";

const DEFAULT_JWT_SECRET = "kisansahayak_local_jwt_secret_2026";

const verifyElevatedUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1] || req.cookies?.jwt;
        if (!token) {
            return res.status(401).json({ error: "Unauthorized - No Token Provided" });
        }

        const decodedUser = await verifyJwt(token, process.env.JWT_SECRET || DEFAULT_JWT_SECRET);
        if (!decodedUser) {
            return res.status(401).json({ error: "Unauthorized - Invalid Token" });
        }

        const user = await Metadata.findOne({ user: decodedUser.userId });
        if (!user || user.totalGP < parseFloat(200)) {
            return res.status(400).json({ error: "User does not possess the permission to perform the following action!" });
        }

        next();
    } catch (err) {
        console.log("Error in verifyElevatedUser middleware", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export default verifyElevatedUser;
