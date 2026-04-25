import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import walletRoutes from "./routes/walletRoutes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Allows us to parse JSON bodies

// API Routes
app.use("/api/wallet", walletRoutes);

// Health Check Route
app.get("/", (req: Request, res: Response) => {
  res.send("Emergency Health Wallet API is running!");
});

// Start the server
app.listen(PORT, () => {
  console.clear();

  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Neural Network AI Engine initialized`);
});
