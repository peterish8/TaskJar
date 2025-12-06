import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // For development, skip authentication check
  // const session = await getServerSession();
  // if (!session) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt, weekWindow } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!weekWindow || !Array.isArray(weekWindow) || weekWindow.length !== 7) {
      return NextResponse.json(
        { error: "Valid weekWindow array with 7 dates is required" },
        { status: 400 }
      );
    }

    // Create a mapping of day names to ISO dates
    const dayToDateMap = weekWindow.map((isoDate, index) => {
      const date = new Date(isoDate);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      return { dayName, isoDate };
    });

    const fullPrompt = `You are an expert task manager. Based on the user's input, generate a list of tasks for the week.

Available dates for this week:
${dayToDateMap
  .map(({ dayName, isoDate }) => `${dayName}: ${isoDate}`)
  .join("\n")}

For each task, provide:
- scheduledDate: one of the ISO dates above (YYYY-MM-DD format)
- name: a clear, concise task name
- description: a brief description (optional)
- priority: "low", "medium", or "high"
- difficulty: "easy", "moderate", or "hard"

Distribute tasks evenly across the week. If the user mentions specific days, use the corresponding ISO date.
If no specific day is mentioned, distribute tasks logically across the week.

Return the output as a valid JSON array of objects. Each object should have: "scheduledDate", "name", "description", "priority", "difficulty".

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
      console.error("Failed to parse AI response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Validate and clean the response
    const validatedTasks = jsonResponse.map((task: any, index: number) => {
      // Ensure scheduledDate is valid and in the week window
      let scheduledDate = task.scheduledDate;
      if (!scheduledDate || !weekWindow.includes(scheduledDate)) {
        // If invalid date, distribute evenly
        const dayIndex = Math.floor(index / Math.ceil(jsonResponse.length / 7));
        scheduledDate = weekWindow[Math.min(dayIndex, 6)];
      }

      return {
        scheduledDate,
        name: task.name || `Task ${index + 1}`,
        description: task.description || "",
        priority: ["low", "medium", "high"].includes(task.priority)
          ? task.priority
          : "medium",
        difficulty: ["easy", "moderate", "hard"].includes(task.difficulty)
          ? task.difficulty
          : "moderate",
      };
    });

    return NextResponse.json(validatedTasks);
  } catch (error) {
    console.error("Error generating weekly tasks:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly tasks" },
      { status: 500 }
    );
  }
}
