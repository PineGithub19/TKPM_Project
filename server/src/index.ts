import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;
const databaseURL = process.env.DB_URL as string;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

mongoose
  .connect(databaseURL)
  .then(() => {
    console.log("[database]: Connected to the database");

    app.listen(port, () => {
      console.log(`[server]: Server is running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.log("[database]: Database connection failed", error);
  });
