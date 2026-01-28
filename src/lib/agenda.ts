import { MongoBackend } from "@agendajs/mongo-backend";
import { Agenda } from "agenda";
import consola from "consola";
import { DATABASE_URL } from "./Env";

let agenda: Agenda | null = null;

/**
 * Initialize and configure Agenda job scheduler
 * Uses MongoDB backend for job persistence
 */
export const initializeAgenda = async (): Promise<Agenda> => {
  if (agenda) {
    return agenda;
  }

  try {
    // Create Agenda instance with MongoDB backend
    agenda = new Agenda({
      backend: new MongoBackend({
        address: DATABASE_URL,
        collection: "agendaJobs", // Collection name for storing jobs
      }),
      processEvery: "1 minute", // How often to check for jobs
      maxConcurrency: 20, // Max number of jobs that can run simultaneously
      defaultConcurrency: 5, // Default concurrency per job type
      defaultLockLifetime: 10 * 60 * 1000, // 10 minutes lock lifetime
    });

    // Wait for Agenda to be ready
    await agenda.ready;

    consola.success("✅ Agenda job scheduler initialized");

    // Graceful shutdown handlers
    const gracefulShutdown = async () => {
      if (agenda) {
        consola.info("🛑 Stopping Agenda gracefully...");
        await agenda.stop();
        consola.success("✅ Agenda stopped");
      }
    };

    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);

    return agenda;
  } catch (error) {
    consola.error("❌ Failed to initialize Agenda:", error);
    throw error;
  }
};

/**
 * Get the Agenda instance
 * Throws error if Agenda is not initialized
 */
export const getAgenda = (): Agenda => {
  if (!agenda) {
    throw new Error(
      "Agenda is not initialized. Call initializeAgenda() first."
    );
  }
  return agenda;
};

/**
 * Start processing jobs
 */
export const startAgenda = async (): Promise<void> => {
  const agendaInstance = getAgenda();
  await agendaInstance.start();
  consola.success("✅ Agenda job processing started");
};
