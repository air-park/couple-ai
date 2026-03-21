import { VISION_MODEL } from "@/lib/ai-models";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export async function callOpenAI(
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API 오류 (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI 응답에서 내용을 추출할 수 없습니다.");
  }
  return content;
}

export async function callOpenAIVision(
  base64Image: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");

  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            {
              type: "text",
              text: `이 이미지에서 대화 내용만 텍스트로 추출해주세요.
카카오톡이나 문자 대화라면 각 메시지를 새 줄로 구분하고,
발신자를 알 수 있으면 "A:" 또는 "B:" 형식으로 앞에 붙여주세요.
텍스트 추출만 해주세요. 다른 설명은 절대 하지 마세요.`,
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI Vision API 오류 (${res.status}): ${body}`);
  }

  const data = await res.json();
  const content: string | undefined = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("이미지에서 텍스트를 추출할 수 없습니다.");
  return content;
}

export function safeParseJSON<T>(text: string): T {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = fenceMatch ? fenceMatch[1] : text;

  try {
    return JSON.parse(jsonText.trim()) as T;
  } catch {
    throw new Error(`JSON 파싱 실패. 응답 앞부분: ${jsonText.slice(0, 200)}`);
  }
}
