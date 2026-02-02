import { NextRequest, NextResponse } from 'next/server';

// You will need to set these in your .env.local file
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Predefined location coordinates
const predefinedLocations: Record<string, { latitude: number; longitude: number }> = {
  'nyc': { latitude: 40.7128, longitude: -74.0060 },
  'sf': { latitude: 37.7749, longitude: -122.4194 },
  'baltimore': { latitude: 39.2904, longitude: -76.6122 }
};

export async function POST(req: NextRequest) {
  try {
    // Check for location parameter in URL
    const url = new URL(req.url);
    const locationParam = url.searchParams.get('location');
    const audienceParam = url.searchParams.get('audience');
    
    let latitude: number;
    let longitude: number;
    let locationName: string | undefined;
    
    let audience: string = 'pat'; // Default persona
    
    if (locationParam && predefinedLocations[locationParam.toLowerCase()]) {
      // Use predefined location coordinates
      const coords = predefinedLocations[locationParam.toLowerCase()];
      latitude = coords.latitude;
      longitude = coords.longitude;
      // Get audience from query parameter if provided
      audience = audienceParam || 'pat';
    } else {
      // Use coordinates from request body
      const body = await req.json();
      latitude = body.latitude;
      longitude = body.longitude;
      locationName = body.locationName;
      audience = body.audience || 'pat'; // Get audience from request body
      
      if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Missing latitude or longitude' }, { status: 400 });
      }
    }

    // Fetch weather data
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=imperial`
    );
    
    if (!weatherRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 500 });
    }

    const weatherData = await weatherRes.json();
    
    // Use provided locationName if available, otherwise use Weather API location
    const location = locationName || weatherData.name;
    const temperature = Math.round(weatherData.main.temp);
    const weatherDescription = weatherData.weather[0].description;
    
    // Calculate local time from timezone offset (in seconds from UTC)
    const timezoneOffset = weatherData.timezone || 0; // seconds from UTC
    const localTime = new Date(Date.now() + timezoneOffset * 1000);
    const localTimeString = localTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Persona definitions with tone and energy tip preferences
    const personaConfig: Record<string, { 
      name: string; 
      tone: string; 
      regionalStyle: string; 
      example: string;
      energyTips: string[];
      type: 'residential' | 'commercial';
    }> = {
      pat: {
        name: 'Pat Gallagher',
        tone: 'warm, steady, practical, motherly, no hype',
        regionalStyle: 'polite Midwestern warmth, modest phrasing',
        example: 'Winters get rough out here, so anything that keeps the house steady is worth considering.',
        energyTips: ['Home Performance'],
        type: 'residential'
      },
      ernie: {
        name: 'Ernie Brown',
        tone: 'direct, concise, practical, cost-focused',
        regionalStyle: 'older-Philly straightforwardness, short and plain phrasing',
        example: 'If it cuts the bill a little, that\'s all I need to hear.',
        energyTips: ['Quick Energy Check-up', 'Home Performance'],
        type: 'residential'
      },
      aaliyah: {
        name: 'Aaliyah Torres',
        tone: 'modern, friendly, lightly energetic, approachable',
        regionalStyle: 'urban Baltimore vibe, casual but clear, youthful phrasing',
        example: 'With the weather jumping around here, little energy saves can really make things easier day to day.',
        energyTips: ['Quick Energy Check-up', 'Home Performance'],
        type: 'residential'
      },
      sam: {
        name: 'Sam Osei',
        tone: 'steady, practical, ROI-focused, businesslike but friendly',
        regionalStyle: 'balanced suburban Maryland tone, measured phrasing',
        example: 'Keeping things running efficiently is one of the easiest ways to avoid surprise expenses.',
        energyTips: ['Building Tune up'],
        type: 'commercial'
      }
    };

    const persona = personaConfig[audience] || personaConfig.pat;
    let energyTips = persona.energyTips;
    if (location?.toLowerCase().includes('chicago')) {
      energyTips = energyTips.filter(tip => tip !== 'Quick Energy Check-up');
    }
    const energyTipText = energyTips.length > 0 ? energyTips.join(' or ') : persona.energyTips.join(' or ');

    // Helper function to count words
    const countWords = (text: string): number => {
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    // Helper function to truncate to 35 words
    const truncateTo35Words = (text: string): string => {
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      if (words.length <= 35) return text;
      return words.slice(0, 35).join(' ') + '...';
    };

    // Generate message using OpenAI with weather, location, and persona context
    const prompt = `
You are a creative copywriter for an energy utility campaign.
Your job is to write short, witty, locally relevant messages using the input.
The goal is to make the message feel human, surprising, and specific to that location — not like a template.

PRIMARY FOCUS: ${location}
Target Audience: ${persona.name} (${persona.type === 'residential' ? 'Residential' : 'Commercial'})

CRITICAL MESSAGE PRIORITY:
- The message MUST be primarily ABOUT ${location} - the location is the prime focus
- Use weather, local time, and current conditions as supporting context to FORM the message about the location
- The message should feel like it's speaking about ${location} specifically, informed by what's happening there right now
- Think: "What makes sense to say about ${location} given these current conditions?" rather than "What do I say about these conditions?"

AUDIENCE-SPECIFIC REQUIREMENTS:
- The message MUST be written in the tone and style of ${persona.name}
- Tone Style: ${persona.tone}
- Regional Style: ${persona.regionalStyle}
- Example of appropriate tone: "${persona.example}"
- The message should feel like it's being spoken directly to ${persona.name}, matching their communication preferences
- For energy tips, focus on: ${energyTipText}
- ${persona.type === 'commercial' ? 'Keep the message business-focused and ROI-oriented, but still friendly.' : 'Keep the message home-focused and practical, emphasizing comfort and savings.'}

IMPORTANT MESSAGE STRUCTURE:
- Lead with location-specific observations or context about ${location}
- Use weather and time as the lens through which you talk about ${location} (e.g., "In ${location}, when it's [condition], [location-specific insight]")
- Reference the weather conditions naturally to inform what you say about ${location} (e.g., if it's hot, talk about how ${location} handles heat; if it's cold, talk about ${location}'s winter patterns) without explicitly stating the temperature or time
- Write like a smart local with a sense of humor, not a corporate marketer. Prioritize wit, insight, or natural observation over symmetry or sales tone.
- DO NOT use or reference any sensitive, tragic, or controversial historical events or topics (e.g., war, slavery, colonialism, racism, natural disasters, or crimes). 
- Keep the message friendly, practical, and relatable
- DO NOT explicitly state the current time or temperature - use them as context to form your message about the location
- CRITICAL: When referring to the location, use NATURAL, CONVERSATIONAL language. People say "In Baltimore" or "Baltimore" or "around here" - NEVER say "In Baltimore, Maryland" or "Baltimore, Maryland" in the actual message. Only use the city name, not "City, State" format. Write like a real person talking, not a formal document.

The message should be:
- 1–2 sentences total
- AT MOST 35 WORDS (this is a hard limit - count your words carefully)
- Written in ${persona.name}'s voice and tone (${persona.tone})
- CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text itself. The message should be written IN their voice and tone, but should NOT mention their name.
- Clever, conversational, and human
- Primarily focused on ${location}, using current conditions to inform what you say about it
- Lightly persuasive, ending on a relatable energy-savings note
- DO NOT use any M-dashes (—) in the message
- Must feel like it's speaking directly to the audience in ${persona.name}'s preferred communication style (but without mentioning their name)
- Should feel timely and relevant because it's about ${location} informed by current conditions, but don't literally state time/temperature

Tone (MUST MATCH ${persona.name.toUpperCase()}):
${persona.tone}
${persona.regionalStyle}
The message should sound like it's being spoken directly to ${persona.name}, using their preferred communication style.
Avoid marketing clichés, rhymes, or obvious puns ("sizzle," "shine bright," "race to savings").
Humor should come from connection, contrast, or surprise, not wordplay.
The goal is to make ${persona.name} think, "That makes sense," not "Okay, cute line."
Your message should always be friendly and inclusive. 
If humor risks sounding dark, insensitive, or sarcastic about serious subjects, do not use it.

Style:
The message should be ABOUT ${location} first and foremost. Use weather and time context to inform what you say about ${location}.
For example: "In ${location}, [location-specific observation informed by current weather/time]..." or "${location} [location characteristic] when [condition-informed context]..."
Then pivot naturally into mentioning ${energyTipText} or related energy efficiency benefits using tone, pacing, or logic — not a pun.
Keep it short and human: 1–2 sentences max.
The line should sound natural if read aloud, like something overheard on a local radio segment or between neighbors.
CRITICAL: The entire message must be written as if speaking directly to ${persona.name} in their preferred tone, and must be primarily about ${location}.
CRITICAL: Use natural, conversational language when referring to the location. Say "In Baltimore" or "Baltimore" or "around here" - NEVER "In Baltimore, Maryland" or "Baltimore, Maryland". Write like a real person talking, not a formal address.

Examples matching ${persona.name}'s tone:
"${persona.example}"

Current context (use these to FORM your message about ${location}, but don't explicitly state these):
- Location: ${location} (THIS IS THE PRIMARY FOCUS - the message should be about this location)
- Local time: ${localTimeString} (use to inform timing relevance - e.g., if evening, reference end of day; if morning, reference start of day)
- Temperature: ${temperature}°F (use to inform weather relevance - e.g., if hot, reference how ${location} handles heat; if cold, reference ${location}'s winter patterns)
- Weather: ${weatherDescription} (use to inform conditions relevance - what does this weather mean for ${location}?)

Output format:
You must output ONLY the message text itself - nothing else. Do NOT include "Location:" or "Message:" labels. Just output the actual message text.

The message should be PRIMARILY ABOUT ${location}. Use weather and time context to inform what you say about ${location}, but DO NOT explicitly state the time or temperature. Write in ${persona.name}'s tone (${persona.tone}) and naturally transition to mention ${energyTipText}.
CRITICAL: When referring to the location in the message, use ONLY the city name (e.g., "Baltimore", "In Baltimore", "around Baltimore") - NEVER use "City, State" format like "Baltimore, Maryland". Write like a real person talking, not a formal document.
CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text. Write in their voice and tone, but do not mention their name.
CRITICAL: Output ONLY the message text - do NOT include any labels like "Location:" or "Message:" in your response. Just the message itself.`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 80,
        temperature: 0.8,
      }),
    });
    
    if (!aiRes.ok) {
      return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
    }

    const aiData = await aiRes.json();
    const messageRaw = aiData.choices?.[0]?.message?.content?.trim() || 'Have a wonderful day!';
    
    // Extract just the message part from the response format
    // Handle formats like "Location: ...\nMessage: ..." or just the message itself
    let message = messageRaw;
    
    // First, try to extract message after "Message:" label
    const messageMatch = messageRaw.match(/Message:\s*([\s\S]+?)$/i);
    if (messageMatch) {
      message = messageMatch[1].trim();
    }
    
    // Remove any "Location:" lines that might have snuck into the message
    message = message.replace(/^Location:\s*[^\n]+\n?/gi, '');
    message = message.replace(/\nLocation:\s*[^\n]+/gi, '');
    
    // Remove leading/trailing quotes (single or double)
    message = message.replace(/^['"]+|['"]+$/g, '');
    // Replace all straight single quotes with curly right single quote
    message = message.replace(/'/g, '\u2019');
    // Replace M-dashes (em dashes) with commas, ensuring proper spacing
    message = message.replace(/\s*—\s*/g, ', ');
    
    // Enforce 35-word limit - truncate if necessary
    const wordCount = countWords(message);
    if (wordCount > 35) {
      message = truncateTo35Words(message);
    }
    
    // Hard rule: Reject if includes sensitive words and auto-regenerate, test if it works
    const sensitiveWords = [
      'slavery', 'slave', 'civil war', 'massacre', 'segregation', 'protest', 'riot', 
      'disaster', 'hurricane', 'killed', 'destroyed', 'burned', 'bomb', 'war', 
      'shooting', 'tragedy'
    ];
    
    // Helper function to check OpenAI moderation API
    const checkModeration = async (text: string): Promise<{ flagged: boolean; reason?: string }> => {
      try {
        const moderationRes = await fetch('https://api.openai.com/v1/moderations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            input: text,
          }),
        });
        
        if (!moderationRes.ok) {
          console.error('Moderation API error:', await moderationRes.text());
          // If moderation API fails, don't block the message but log the error
          return { flagged: false };
        }
        
        const moderationData = await moderationRes.json();
        const result = moderationData.results?.[0];
        
        if (result?.flagged) {
          // Find which categories were flagged
          const flaggedCategories = Object.entries(result.categories || {})
            .filter(([, flagged]) => flagged)
            .map(([category]) => category);
          
          return {
            flagged: true,
            reason: `flagged by moderation API (categories: ${flaggedCategories.join(', ')})`,
          };
        }
        
        return { flagged: false };
      } catch (error) {
        console.error('Error checking moderation:', error);
        // If moderation check fails, don't block the message but log the error
        return { flagged: false };
      }
    };
    
    const checkForSensitiveWords = (text: string) => {
      return sensitiveWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
    };
    
    const formatMessage = (rawMessage: string) => {
      let formatted = rawMessage;
      const messageMatch = rawMessage.match(/Message:\s*([\s\S]+?)$/i);
      if (messageMatch) {
        formatted = messageMatch[1].trim();
      }
      // Remove any "Location:" lines that might have snuck into the message
      formatted = formatted.replace(/^Location:\s*[^\n]+\n?/gi, '');
      formatted = formatted.replace(/\nLocation:\s*[^\n]+/gi, '');
      formatted = formatted.replace(/^['"]+|['"]+$/g, '');
      formatted = formatted.replace(/'/g, '\u2019');
      formatted = formatted.replace(/\s*—\s*/g, ', ');
      // Enforce 35-word limit
      const wordCount = countWords(formatted);
      if (wordCount > 35) {
        formatted = truncateTo35Words(formatted);
      }
      return formatted;
    };
    
    // Check initial message and retry if needed (max 3 attempts total)
    // Order: 1. Moderation check, 2. Sensitive words check, 3. Format check
    let attempts = 1;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      // Step 1: Check OpenAI moderation
      const moderationCheck = await checkModeration(message);
      if (moderationCheck.flagged) {
        attempts++;
        const retryPrompt = prompt + `\n\nIMPORTANT: The previous response was ${moderationCheck.reason}. This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that passes content moderation and is AT MOST 35 WORDS. CRITICAL: The message must be PRIMARILY ABOUT ${location}. Use weather and time context to inform what you say about ${location}, but DO NOT explicitly state the time or temperature. When referring to the location, use ONLY the city name (e.g., "Baltimore", "In Baltimore") - NEVER "City, State" format. CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text. Write in ${persona.name}'s tone (${persona.tone}) but do not mention their name. Remember: The message MUST be written in ${persona.name}'s tone (${persona.tone}) and should reference ${energyTipText} naturally.`;
        
        const retryRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: retryPrompt }],
            max_tokens: 80,
            temperature: 0.7 + (attempts * 0.1), // Vary temperature for different seeds
          }),
        });
        
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryMessageRaw = retryData.choices?.[0]?.message?.content?.trim() || 'Have a wonderful day!';
          message = formatMessage(retryMessageRaw);
          continue; // Check again from the top
        } else {
          // If retry fails, break out of loop and use current message
          break;
        }
      }
      
      // Step 2: Check for sensitive words
      if (checkForSensitiveWords(message)) {
        attempts++;
        const retryPrompt = prompt + `\n\nIMPORTANT: The previous response contained sensitive content. This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that avoids any sensitive topics and is AT MOST 35 WORDS. CRITICAL: The message must be PRIMARILY ABOUT ${location}. Use weather and time context to inform what you say about ${location}, but DO NOT explicitly state the time or temperature. When referring to the location, use ONLY the city name (e.g., "Baltimore", "In Baltimore") - NEVER "City, State" format. CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text. Write in ${persona.name}'s tone (${persona.tone}) but do not mention their name. Remember: The message MUST be written in ${persona.name}'s tone (${persona.tone}) and should reference ${energyTipText} naturally.`;
        
        const retryRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: retryPrompt }],
            max_tokens: 80,
            temperature: 0.7 + (attempts * 0.1), // Vary temperature for different seeds
          }),
        });
        
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryMessageRaw = retryData.choices?.[0]?.message?.content?.trim() || 'Have a wonderful day!';
          message = formatMessage(retryMessageRaw);
          continue; // Check again from the top
        } else {
          // If retry fails, break out of loop and use current message
          break;
        }
      }
      
      // Step 3: Check format (word count)
      if (countWords(message) > 35) {
        attempts++;
        const retryPrompt = prompt + `\n\nIMPORTANT: The previous response exceeded 35 words (had ${countWords(message)} words). This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that is AT MOST 35 WORDS. CRITICAL: The message must be PRIMARILY ABOUT ${location}. Use weather and time context to inform what you say about ${location}, but DO NOT explicitly state the time or temperature. When referring to the location, use ONLY the city name (e.g., "Baltimore", "In Baltimore") - NEVER "City, State" format. CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text. Write in ${persona.name}'s tone (${persona.tone}) but do not mention their name. Remember: The message MUST be written in ${persona.name}'s tone (${persona.tone}) and should reference ${energyTipText} naturally.`;
        
        const retryRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: retryPrompt }],
            max_tokens: 80,
            temperature: 0.7 + (attempts * 0.1), // Vary temperature for different seeds
          }),
        });
        
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryMessageRaw = retryData.choices?.[0]?.message?.content?.trim() || 'Have a wonderful day!';
          message = formatMessage(retryMessageRaw);
          continue; // Check again from the top
        } else {
          // If retry fails, break out of loop and use current message
          break;
        }
      }
      
      // All checks passed, break out of loop
      break;
    }
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in generate-message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 