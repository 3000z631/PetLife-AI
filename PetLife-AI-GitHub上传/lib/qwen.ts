type JsonSchema = Record<string, unknown>;

function cleanJson(content: string) {
  return content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

export async function createVisionJson<T>({
  image,
  prompt,
  instructions,
  schema,
}: {
  image: string;
  prompt: string;
  instructions: string;
  schema: JsonSchema;
}): Promise<T> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const baseUrl = process.env.DASHSCOPE_BASE_URL?.replace(/\/$/, "");
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY_MISSING");
  if (!baseUrl) throw new Error("DASHSCOPE_BASE_URL_MISSING");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.QWEN_VISION_MODEL || "qwen3.7-plus",
      messages: [
        {
          role: "system",
          content: `${instructions}\n必须只输出合法 JSON，不要输出 Markdown。JSON Schema：${JSON.stringify(schema)}`,
        },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: image } },
            { type: "text", text: prompt },
          ],
        },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `千问视觉服务返回 ${response.status}`);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("千问视觉模型没有返回结果");
  return JSON.parse(cleanJson(content)) as T;
}

export function visionConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : "视觉模型暂时不可用";
  if (message === "DASHSCOPE_API_KEY_MISSING") {
    return Response.json({ error: "视觉接口已接入，请先配置 DASHSCOPE_API_KEY" }, { status: 503 });
  }
  if (message === "DASHSCOPE_BASE_URL_MISSING") {
    return Response.json({ error: "请配置百炼工作空间对应的 DASHSCOPE_BASE_URL" }, { status: 503 });
  }
  return Response.json({ error: message }, { status: 502 });
}
