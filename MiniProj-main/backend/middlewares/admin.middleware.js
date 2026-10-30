import { verifyJwt } from "../utils/jwt.js";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = await verifyJwt(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.adminPassword) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        }

        if (decoded.adminPassword !== ADMIN_PASSWORD) {
            return res.status(403).json({ message: "Forbidden: Invalid admin password" });
        }

        next();
    } catch (error) {
        console.warn("Admin token verification failed:", error.message);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

export default verifyAdmin;
