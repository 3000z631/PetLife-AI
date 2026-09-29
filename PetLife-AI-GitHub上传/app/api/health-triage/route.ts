import { apiError, createTextJson, validateImageDataUrl } from "../../../lib/deepseek";
import { createVisionJson } from "../../../lib/qwen";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    risk_level: { type: "string", enum: ["观察", "尽快就医", "立即急诊"] },
    title: { type: "string" },
    summary: { type: "string" },
    possible_directions: { type: "array", items: { type: "string" } },
    actions: { type: "array", items: { type: "string" } },
    red_flags: { type: "array", items: { type: "string" } },
    prohibited_actions: { type: "array", items: { type: "string" } },
  },
  required: ["risk_level", "title", "summary", "possible_directions", "actions", "red_flags", "prohibited_actions"],
};

const observationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    observations: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["observations", "limitations"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      image?: unknown;
      description?: unknown;
      profile?: { breed?: string; age?: number; weight?: number };
    };
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 2000) : "";
    if (!description) return Response.json({ error: "请先描述症状和持续时间" }, { status: 400 });
    const image = body.image ? validateImageDataUrl(body.image) : undefined;
    const vision = image ? await createVisionJson<{ observations: string[]; limitations: string[] }>({
      image,
      schema: observationSchema,
      instructions: "你是宠物图片观察助手，不是兽医。只记录图片中客观可见的外观，不诊断疾病，不推测图片无法证明的信息。使用简体中文。",
      prompt: "记录与用户描述相关的可见现象，例如部位、颜色、肿胀、分泌物、脱毛或外伤；同时列出照片角度、清晰度等限制。",
    }) : undefined;
    const profile = body.profile ?? {};
    const result = await createTextJson({
      schema,
      instructions: "你是猫咪健康风险分级助手，不是兽医。你的任务仅是评估紧急程度和安全的下一步行动。不得确诊、开药、给出剂量、建议使用人药或用确定语气描述疾病。对无法排尿、呼吸困难、抽搐、昏迷、中毒、大量出血或严重外伤必须分为立即急诊。信息不足时宁可建议就医。使用简体中文。",
      prompt: `猫咪资料：品种${profile.breed || "未知"}，年龄${profile.age ?? "未知"}岁，体重${profile.weight ?? "未知"}kg。用户描述：${description}\n视觉模型的客观观察：${vision ? JSON.stringify(vision) : "未上传图片"}\n请进行风险分级。possible_directions只写需要兽医排查的方向，不写确诊；actions只写安全观察、记录、运输或就医准备；prohibited_actions明确禁止危险操作。`,
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
