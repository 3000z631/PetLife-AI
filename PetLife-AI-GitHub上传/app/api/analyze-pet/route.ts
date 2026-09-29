import { validateImageDataUrl } from "../../../lib/deepseek";
import { createVisionJson, visionConfigError } from "../../../lib/qwen";

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_cat: { type: "boolean" },
    breed: { type: "string" },
    breed_confidence: { type: "number", minimum: 0, maximum: 1 },
    age_min_months: { type: "integer", minimum: 0, maximum: 360 },
    age_max_months: { type: "integer", minimum: 0, maximum: 360 },
    bcs_min: { type: "integer", minimum: 1, maximum: 9 },
    bcs_max: { type: "integer", minimum: 1, maximum: 9 },
    visible_features: { type: "array", items: { type: "string" } },
    limitations: { type: "array", items: { type: "string" } },
  },
  required: ["is_cat", "breed", "breed_confidence", "age_min_months", "age_max_months", "bcs_min", "bcs_max", "visible_features", "limitations"],
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { image?: unknown };
    const image = validateImageDataUrl(body.image);
    const result = await createVisionJson({
      image,
      schema,
      instructions: "你是宠物图像资料整理助手。仅描述图片中可见事实并给出保守估计。品种、年龄和BCS必须承认不确定性；绝不从照片估算体重、诊断疾病或声称确定结论。使用简体中文。",
      prompt: "分析图片是否为猫，并保守估计最可能的常见品种、年龄范围和9分制BCS范围。列出可见依据与限制。若不是猫，breed写‘无法识别’，数值使用允许范围内的保守默认值。",
    });
    return Response.json(result);
  } catch (error) {
    return visionConfigError(error);
  }
}
