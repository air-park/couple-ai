export async function GET() {
  return Response.json({
    hasKey: !!process.env.OPENAI_API_KEY,
    keyPrefix: process.env.OPENAI_API_KEY?.slice(0, 7) ?? "없음",
  });
}
