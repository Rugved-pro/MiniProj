import express from "express";
import { deleteAccount, login, logout, register } from "../controllers/auth.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout/:id", logout);
router.delete("/delete-account", verifyToken, deleteAccount);

export default router;