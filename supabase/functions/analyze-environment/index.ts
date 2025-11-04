import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert occupational safety and home environment analyst. Analyze the provided image of a living environment and identify:

1. Safety hazards (e.g., wet electrical outlets, blocked walkways, trip hazards, fire risks, unstable furniture, mold, poor lighting, clutter blocking exits)
2. Suggested improvement tasks that can be completed in 5, 10, or 20 minutes
3. Overall safety assessment

Respond with structured JSON only, no additional text.`;

    const userPrompt = `Analyze this environment photo and provide:
- List of hazards with type, severity (low/medium/high/critical), description, and location
- 3-5 actionable tasks with title, duration (5/10/20 minutes), priority (low/medium/high), and description
- Overall safety rating (safe/concerns/unsafe)
- Brief summary

Return ONLY valid JSON matching this structure:
{
  "hazards": [{"type": "string", "severity": "low|medium|high|critical", "description": "string", "location": "string"}],
  "tasks": [{"title": "string", "duration": 5|10|20, "priority": "low|medium|high", "description": "string"}],
  "overallSafety": "safe|concerns|unsafe",
  "summary": "string"
}`;

    console.log("Sending request to Lovable AI");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: image } }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received response from Lovable AI");
    
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let analysisResult;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    // Validate the structure
    if (!analysisResult.hazards || !analysisResult.tasks || !analysisResult.overallSafety) {
      console.error("Incomplete analysis result:", analysisResult);
      throw new Error("Incomplete analysis from AI");
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-environment:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
