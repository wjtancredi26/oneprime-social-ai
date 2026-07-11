import dotenv from "dotenv";
import app from "./app.js";
import { startScheduler } from "./services/schedulerService.js";

dotenv.config({ override: true });

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
  startScheduler();
});