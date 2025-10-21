import "./admin.openapi";

import express, { type Router } from "express";
import { getallUser } from "./admin.service";

export const admin: Router = express.Router();

admin.get("/users", getallUser);
