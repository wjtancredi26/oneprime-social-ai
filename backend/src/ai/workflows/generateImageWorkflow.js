import { executeImageAgent } from "../agents/imageAgent.js";

export async function generateImageWorkflow({ imagePrompt }) {
  const image = await executeImageAgent({
    imagePrompt,
    style: "Publicidade premium",
  });

  return {
    type: "image",
    workflow: "generate_image",
    image,
  };
}