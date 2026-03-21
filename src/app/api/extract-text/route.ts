import { callOpenAIVision } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "이미지 파일이 없습니다." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "이미지 파일만 업로드 가능합니다." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return Response.json({ error: "5MB 이하 이미지만 업로드 가능합니다." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const text = await callOpenAIVision(base64, file.type);

    return Response.json({ text });
  } catch (error) {
    console.error("Extract text error:", error);
    const message = error instanceof Error ? error.message : "텍스트 추출 중 오류가 발생했습니다.";
    return Response.json({ error: message }, { status: 500 });
  }
}
