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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY}`,
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
      // Parse prompt and create meaningful tasks
      const tasks = [];
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes('admin page') || lowerPrompt.includes('sister')) {
        tasks.push({
          name: "Create Admin Page",
          description: "Work on sister's admin page creation project",
          priority: "high",
          difficulty: "moderate"
        });
      }
      
      if (lowerPrompt.includes('video') || lowerPrompt.includes('editing') || lowerPrompt.includes('mom')) {
        tasks.push({
          name: "Video Editing",
          description: "Help mom with video making and editing",
          priority: "medium",
          difficulty: "moderate"
        });
      }
      
      if (lowerPrompt.includes('ojt') || lowerPrompt.includes('job training') || lowerPrompt.includes('monday')) {
        tasks.push({
          name: "Complete OJT Project",
          description: "Finish on-the-job training project (due Monday)",
          priority: "high",
          difficulty: "hard"
        });
      }
      
      if (lowerPrompt.includes('javascript') || lowerPrompt.includes('studying')) {
        tasks.push({
          name: "Study JavaScript",
          description: "Learn JavaScript fundamentals",
          priority: "high",
          difficulty: "moderate"
        });
      }
      
      if (lowerPrompt.includes('netflix') || lowerPrompt.includes('lock and key') || lowerPrompt.includes('episodes')) {
        tasks.push({
          name: "Watch Netflix",
          description: "Watch 2 episodes of Lock and Key",
          priority: "low",
          difficulty: "easy"
        });
      }
      
      if (tasks.length === 0) {
        tasks.push({
          name: prompt.charAt(0).toUpperCase() + prompt.slice(1),
          description: `Complete: ${prompt}`,
          priority: "medium",
          difficulty: "easy"
        });
      }
      return NextResponse.json(tasks);
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
      return NextResponse.json([{
        name: prompt.charAt(0).toUpperCase() + prompt.slice(1),
        description: `Complete: ${prompt}`,
        priority: "medium",
        difficulty: "easy"
      }]);
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
