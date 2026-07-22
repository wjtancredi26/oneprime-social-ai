import { executeSchedulerAgent } from "../agents/schedulerAgent.js";

export async function scheduleWorkflow(data) {
  const post = await executeSchedulerAgent(data);

  return {
    type: "schedule",
    success: true,
    message: "Postagem agendada com sucesso.",
    post,
  };
}