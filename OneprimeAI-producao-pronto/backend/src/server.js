import "dotenv/config";

const [{ default: app }, { startScheduler, stopScheduler }] = await Promise.all([
  import("./app.js"),
  import("./services/schedulerService.js"),
]);

const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend rodando na porta ${PORT}`);
  void startScheduler();
});

function shutdown(signal) {
  console.log(`${signal} recebido. Encerrando o backend com segurança...`);
  stopScheduler();

  server.close(() => {
    console.log("Servidor HTTP encerrado.");
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
