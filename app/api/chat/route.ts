import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/chat
 * Handles generative AI chat requests.
 * 
 * Supports OpenAI-compatible APIs (OpenAI, Groq, Anthropic via proxy, etc.)
 * Set OPENAI_API_KEY and optionally OPENAI_BASE_URL in your environment.
 */

const SYSTEM_PROMPT = `You are Cam Spec Elite AI — a knowledgeable automotive performance assistant specializing in:
- Camshaft specifications, selection, and tuning
- Engine building and horsepower calculations
- Drag racing and roll racing performance
- Gear ratios, turbo sizing, and boost calculations
- Cylinder head flow data and port work
- General automotive performance questions

CRITICAL RULES:
1. NEVER recommend parts from the wrong manufacturer. Ford parts only fit Ford engines, Chevy parts only fit Chevy engines, etc.
2. When recommending cylinder heads, ONLY suggest heads designed for the specific engine platform (e.g., Ford Windsor heads for Windsor engines, SBC heads for Small Block Chevy).
3. Common Ford Windsor aftermarket heads: AFR 165/185/205 Renegade, Trick Flow Twisted Wedge/Track Heat, Edelbrock Victor Jr/E-Street, Ford Racing, Dart Windsor, World Products Windsor Sr.
4. Common SBC aftermarket heads: AFR 180/195/210/220 Eliminator, Trick Flow GenX, Edelbrock E-Tec/Victor Jr, Dart SHP/Pro 1, World Products S/R Torquer.
5. Common BBC aftermarket heads: AFR 265/290/315 Oval Port/Rectangle Port, Trick Flow PowerPort, Edelbrock Victor, Dart Pro 1.
6. Always verify the head is compatible with the specific engine family before recommending.

Be concise, accurate, and helpful. Use technical language when appropriate but explain complex concepts clearly.
When discussing cam specs, mention relevant details like duration at .050, lift, LSA, and intended RPM range.
For horsepower estimates, consider factors like displacement, compression, airflow, and intended use.

Format responses with:
- Clear headings when covering multiple topics
- Bullet points for lists of specs or recommendations
- Bold for important values or warnings

Keep responses focused and practical for performance enthusiasts.`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, stream = false } = body as {
      messages: ChatMessage[];
      stream?: boolean;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { ok: false, message: "messages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, message: "AI service not configured. Set OPENAI_API_KEY in environment." },
        { status: 503 }
      );
    }

    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    // Prepend system prompt
    const fullMessages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    if (stream) {
      // Streaming response
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error:", errorText);
        return NextResponse.json(
          { ok: false, message: "AI service error" },
          { status: 502 }
        );
      }

      // Forward the stream
      return new NextResponse(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      // Non-streaming response
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API error:", errorText);
        return NextResponse.json(
          { ok: false, message: "AI service error" },
          { status: 502 }
        );
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "";

      return NextResponse.json({
        ok: true,
        message: assistantMessage,
        usage: data.usage,
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { ok: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
