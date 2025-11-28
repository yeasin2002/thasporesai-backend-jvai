import "./seed.openapi";

import express, { type Router } from "express";
import { seedCategories, seedLocations, seedUsers } from "./services";

export const seed: Router = express.Router();

seed
  .post("/locations", seedLocations)
  .post("/users", seedUsers)
  .post("/categories", seedCategories);
