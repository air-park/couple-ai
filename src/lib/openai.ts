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
              text: `이 이미지는 카카오톡 또는 문자 대화 캡처입니다. 대화 텍스트만 정확히 추출해주세요.

규칙:
- 카카오톡 기준: 오른쪽 말풍선 = A (나), 왼쪽 말풍선 = B (상대방)
- 상대방 이름이 보이면 B 대신 그 이름 사용 가능
- 각 메시지는 새 줄로 구분, 형식: "A: 메시지내용" 또는 "B: 메시지내용"
- 날짜 구분선, 시스템 메시지(예: "○○님이 입장", 날짜/시간 표시)는 제외
- 이모티콘은 텍스트로 표현 가능하면 표현, 불가능하면 [이모티콘]으로 표기
- 사진/동영상은 [사진] 또는 [동영상]으로 표기
- 절대 설명이나 부연 없이 대화 내용만 출력`,
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
