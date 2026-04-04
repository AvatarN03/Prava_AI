
import { NextResponse } from "next/server";

import Groq from "groq-sdk";

export async function POST(req) {
  try {
    const body = await req.json();
    const { messages, userPreferences } = body;
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }
    const groq = new Groq({ apiKey });

    // Updated System Instruction:
    // 1. Explicitly handles "From -> To" logic.
    // 2. Enforces the specific JSON format you need.
    const systemInstruction = `
      You are an expert AI Travel Assistant.
      
      **Current User Preferences:** ${JSON.stringify(userPreferences || [])}
      
      **Protocol:**
      1. Analyze the user's request to identify:
         - **Destination** (Where they want to go)
         - **Source** (Where they are coming from, if mentioned)
         - **Duration** (How many days)
         - **Budget**
         - **Travelers**
      
      2. If the user says "Plan a trip to X from Y", the DESTINATION is X. Do not say it is impossible to travel between countries.
      
      3. If specific details (Destination, Duration, Budget, Travelers) are missing, ask for them politely.
      
      4. Once you have the details, generate a **COMPLETE** JSON plan. Do not cut it off.
      
      **JSON Schema (Strictly follow this structure):**
      {
        "tripDetails": {
          "title": "Short catchy title",
          "destination": "City, Country",
          "duration": "5 days",
          "budget": 2000,
          "currency": "INR",
          "travelers": 2
        },
        "budget_category": "Cheap | Moderate | Luxury",
        "total_estimated_cost": "Total cost string",
        "best_season": "Best time to visit string",
        "travel_type": "Solo | Couple | Family | Friends",
        "budget_breakdown": {
          "accommodation": "Estimated cost",
          "activities": "Estimated cost",
          "food": "Estimated cost",
          "transportation": "Estimated cost",
          "miscellaneous": "Estimated cost"
        },
        "transportation_tips": "Advice on getting around",
        "hotel_options": [
          {
            "name": "Hotel Name",
            "address": "Full Address",
            "price_per_night": "Amount",
            "image_url": "URL or placeholder",
            "geo_coordinates": "lat, long",
            "rating": "4.5 stars",
            "description": "Short description"
          }
        ],
        "itinerary": [
          {
            "day": "Day 1",
            "date": "YYYY-MM-DD",
            "theme": "Day Theme",
            "plan": [
              {
                "place": "Place Name",
                "details": "Activity details",
                "image_url": "URL or placeholder",
                "geo_coordinates": "lat, long",
                "ticket_pricing": "Cost",
                "rating": "4.5 stars",
                "time": "Morning/Afternoon/Evening",
                "time_to_spend": "e.g., 2 hours",
                "travel_time_from_previous": "e.g., 15 minutes",
                "best_time_to_visit": "e.g., Morning"
              }
            ]
          }
        ],
        "local_cuisine": ["Dish 1", "Dish 2", "Dish 3"],
        "packing_suggestions": ["Item 1", "Item 2"],
        "safety_tips": ["Tip 1", "Tip 2"]
      }
    `;

    const allMessages = [
      { role: "system", content: systemInstruction },
      ...messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content || "",
      })),
    ];

    const completion = await groq.chat.completions.create({
      messages: allMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_completion_tokens: 8000, // INCREASED from 1024 to 8000 to prevent cut-off
    });

    const reply = completion.choices[0]?.message?.content || "";

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("Groq Error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}


