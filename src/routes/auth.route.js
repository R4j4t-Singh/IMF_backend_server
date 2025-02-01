import { Router } from "express";
import { login, logOut, signUp } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", login);

router.post("/signup", signUp);

router.get("/logout", logOut);

export default router;
