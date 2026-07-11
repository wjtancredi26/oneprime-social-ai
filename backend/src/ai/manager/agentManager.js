import { executeMarketingAgent } from "../agents/marketingAgent.js";
import { executeImageAgent } from "../agents/imageAgent.js";
import { executeSchedulerAgent } from "../agents/schedulerAgent.js";

export async function runAgentManager(task) {
  switch (task.agent) {
    case "marketing":
      return await executeMarketingAgent(task.message);

    case "image":
      return await executeImageAgent({
        imagePrompt: task.imagePrompt,
      });

    case "scheduler":
      return await executeSchedulerAgent(task.data);

    default:
      throw new Error(`Agente '${task.agent}' não encontrado.`);
  }
}