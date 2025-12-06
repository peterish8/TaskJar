import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const fullPrompt = `You are an expert task manager. Based on the user's input, generate a list of tasks.
For each task, provide a name, a brief description, a priority, and a difficulty.
The priority can be one of: "low", "medium", "high".
The difficulty can be one of: "easy", "moderate", "hard".

Return the output as a valid JSON array of objects. Each object should have the following properties: "name", "description", "priority", "difficulty".

User input: "${prompt}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(
        text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
      );
    } catch (parseError) {
      return NextResponse.json(
        { error: "Failed to parse AI response", rawText: text },
        { status: 500 }
      );
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error generating tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate tasks", details: error.message },
      { status: 500 }
    );
  }
}
