import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate 3-5 tasks based on: ${prompt}. Return as JSON array with name, description, priority (low/medium/high), difficulty (easy/moderate/hard).` }]
          }]
        })
      }
    );

    if (!response.ok) {
      // Fallback to mock data if API fails
      const mockTasks = [
        {
          name: "Task 1",
          description: `Complete ${prompt} related activity`,
          priority: "medium",
          difficulty: "moderate"
        },
        {
          name: "Task 2", 
          description: `Review ${prompt} requirements`,
          priority: "high",
          difficulty: "easy"
        },
        {
          name: "Task 3",
          description: `Plan ${prompt} implementation`,
          priority: "low",
          difficulty: "hard"
        }
      ];
      return NextResponse.json(mockTasks);
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
      // Fallback to mock data if parsing fails
      const mockTasks = [
        {
          name: "Generated Task",
          description: `Task related to ${prompt}`,
          priority: "medium",
          difficulty: "moderate"
        }
      ];
      return NextResponse.json(mockTasks);
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
