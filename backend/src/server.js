import dotenv from "dotenv";
import app from "./app.js";
import { startScheduler } from "./services/schedulerService.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando na porta ${PORT}`);
  startScheduler();
});