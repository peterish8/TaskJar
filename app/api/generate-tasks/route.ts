import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || ""
);

export async function POST(req: NextRequest) {
  // For development, skip authentication check
  // const session = await getServerSession();
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `
      You are an expert task manager. Based on the user's input, generate a list of tasks.
      For each task, provide a name, a brief description, a priority, and a difficulty.
      The priority can be one of: "low", "medium", "high".
      The difficulty can be one of: "easy", "moderate", "hard".
      
      Return the output as a valid JSON array of objects. Each object should have the following properties: "name", "description", "priority", "difficulty".
      
      User input: "${prompt}"
    `;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = await response.text();

    const jsonResponse = JSON.parse(
      text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Error generating tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
