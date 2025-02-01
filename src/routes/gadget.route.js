import { Router } from "express";
import {
  addGadget,
  getGadgets,
  removeGadget,
  selfDestruct,
  updateGadget,
} from "../controllers/gadget.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", auth, getGadgets);

router.post("/", auth, addGadget);

router.patch("/:id", auth, updateGadget);

router.delete("/:id", auth, removeGadget);

router.post("/:id/self-destruct", auth, selfDestruct);

export default router;
