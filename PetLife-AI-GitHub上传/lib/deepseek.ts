const API_URL = `${process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com"}/chat/completions`;
const MAX_IMAGE_CHARS = 7_000_000;

type JsonSchema = Record<string, unknown>;

export function validateImageDataUrl(image: unknown) {
  if (typeof image !== "string" || !/^data:image\/(jpeg|png|webp);base64,/i.test(image)) {
    throw new Error("请上传 JPG、PNG 或 WebP 图片");
  }
  if (image.length > MAX_IMAGE_CHARS) throw new Error("图片过大，请压缩到 5MB 以内");
  return image;
}

export async function createTextJson<T>({
  prompt,
  instructions,
  schema,
}: {
  prompt: string;
  instructions: string;
  schema: JsonSchema;
}): Promise<T> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY_MISSING");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `${instructions}\n必须只输出一个合法 JSON 对象，不要输出 Markdown。JSON Schema：${JSON.stringify(schema)}`,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      stream: false,
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message || `DeepSeek 服务返回 ${response.status}`);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("DeepSeek 没有返回可解析的结果");
  return JSON.parse(content) as T;
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "模型服务暂时不可用";
  if (message === "DEEPSEEK_API_KEY_MISSING") {
    return Response.json({ error: "服务器尚未配置 DEEPSEEK_API_KEY" }, { status: 503 });
  }
  const isInputError = message.includes("上传") || message.includes("图片过大");
  return Response.json({ error: message }, { status: isInputError ? 400 : 502 });
}
