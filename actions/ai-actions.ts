"use server"

import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export async function generateAIInsights(symptomData: any[], medicationData: any[], symptomTypes: string[]) {
  try {
    // Generate the prompt for the AI
    const prompt = `
      You are a medical AI assistant. Analyze the patient data and return ONLY a valid JSON array.
      
      SYMPTOM DATA: ${JSON.stringify(symptomData, null, 2)}
      MEDICATION DATA: ${JSON.stringify(medicationData, null, 2)}
      SYMPTOM TYPES: ${JSON.stringify(symptomTypes, null, 2)}
      
      Return exactly 5 insights as a JSON array. Each insight should identify patterns and provide actionable advice.
      
      IMPORTANT: Your response must be ONLY valid JSON. No explanatory text before or after.
      
      Format:
      [
        {"insight": "Your symptoms tend to be worse on weekdays, particularly Monday and Tuesday. This could indicate work-related stress as a trigger.", "confidence": 75},
        {"insight": "High humidity days (above 70%) correlate with increased joint pain severity. Consider using a dehumidifier indoors.", "confidence": 82},
        {"insight": "Your medication timing appears consistent, but symptoms still fluctuate. Discuss dosage adjustments with your doctor.", "confidence": 68},
        {"insight": "Pain levels decrease on weekends, suggesting rest and reduced activity help manage inflammation.", "confidence": 71},
        {"insight": "Weather pressure changes 24 hours before storms may trigger symptom flares. Monitor weather forecasts.", "confidence": 79}
      ]
    `

    // Initialize Groq with API key from server environment
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Call Groq API
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      system:
        "You are a medical data analyst. You ONLY return valid JSON arrays. Never include explanatory text outside the JSON structure.",
    })

    // Clean and extract JSON from the response
    const cleanedText = extractJSON(text)

    return { success: true, data: cleanedText }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    return { success: false, error: "Failed to generate insights. Please try again later." }
  }
}

export async function generatePatternVisualizations(
  symptomData: any[],
  medicationData: any[],
  symptomTypes: string[],
  timeRange: number,
) {
  try {
    // Generate the prompt for the AI
    const prompt = `
      Analyze symptom data and return ONLY a valid JSON array of 4 visualizations.
      
      SYMPTOM DATA: ${JSON.stringify(symptomData.slice(0, 50), null, 2)}
      MEDICATION DATA: ${JSON.stringify(medicationData, null, 2)}
      SYMPTOM TYPES: ${JSON.stringify(symptomTypes, null, 2)}
      TIME RANGE: ${timeRange} months
      
      Return exactly 4 visualization objects as JSON. No explanatory text.
      
      Format:
      [
        {
          "type": "weekly",
          "title": "Weekly Symptom Pattern",
          "description": "Shows how symptoms vary by day of the week",
          "chartType": "bar",
          "data": [
            {"day": "Monday", "severity": 2.1, "count": 3},
            {"day": "Tuesday", "severity": 1.8, "count": 4},
            {"day": "Wednesday", "severity": 2.3, "count": 2}
          ],
          "insights": ["Symptoms peak on Mondays", "Weekends show lower severity"],
          "confidence": 75
        },
        {
          "type": "monthly",
          "title": "Monthly Trends",
          "description": "Shows symptom trends over months",
          "chartType": "line",
          "data": [
            {"month": "January", "severity": 2.0, "frequency": 8},
            {"month": "February", "severity": 1.9, "frequency": 6}
          ],
          "insights": ["Symptoms improve in warmer months", "Winter shows higher severity"],
          "confidence": 68
        },
        {
          "type": "weather",
          "title": "Weather Correlation",
          "description": "Shows relationship between weather and symptoms",
          "chartType": "scatter",
          "data": [
            {"temperature": 25, "severity": 1, "name": "Day 1"},
            {"temperature": 30, "severity": 3, "name": "Day 2"}
          ],
          "insights": ["High temperatures correlate with worse symptoms", "Humidity affects joint pain"],
          "confidence": 72
        },
        {
          "type": "medication",
          "title": "Medication Impact",
          "description": "Shows medication effectiveness over time",
          "chartType": "composed",
          "data": [
            {"name": "Week 1", "severity": 2.5, "frequency": 5},
            {"name": "Week 2", "severity": 2.0, "frequency": 3}
          ],
          "insights": ["Medication shows positive effect", "Consistency improves outcomes"],
          "confidence": 80
        }
      ]
    `

    // Initialize Groq with API key from server environment
    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Call Groq API
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      system:
        "You are a data visualization AI. You ONLY return valid JSON arrays. Never include explanatory text outside the JSON structure.",
    })

    // Clean and extract JSON from the response
    const cleanedText = extractJSON(text)

    return { success: true, data: cleanedText }
  } catch (error) {
    console.error("Error generating pattern visualizations:", error)
    return { success: false, error: "Failed to generate visualizations. Please try again later." }
  }
}

// Helper function to extract JSON from AI response
function extractJSON(text: string): string {
  try {
    // First, try to parse the text as-is
    JSON.parse(text.trim())
    return text.trim()
  } catch {
    // If that fails, try to extract JSON from the text

    // Look for JSON array patterns
    const jsonArrayMatch = text.match(/\[[\s\S]*\]/)
    if (jsonArrayMatch) {
      try {
        JSON.parse(jsonArrayMatch[0])
        return jsonArrayMatch[0]
      } catch {
        // Continue to next method
      }
    }

    // Look for content between ```json and ``` markers
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      try {
        JSON.parse(codeBlockMatch[1])
        return codeBlockMatch[1]
      } catch {
        // Continue to next method
      }
    }

    // Try to find the first [ and last ] and extract that
    const firstBracket = text.indexOf("[")
    const lastBracket = text.lastIndexOf("]")

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const extracted = text.substring(firstBracket, lastBracket + 1)
      try {
        JSON.parse(extracted)
        return extracted
      } catch {
        // Continue to fallback
      }
    }

    // If all else fails, return a fallback JSON structure
    console.warn("Could not extract valid JSON from AI response:", text)
    throw new Error("Could not extract valid JSON from AI response")
  }
}
