import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// ── Persona config (mirrors generate-message/route.ts) ───────────────────────
const personaConfig: Record<string, {
  name: string;
  tone: string;
  regionalStyle: string;
  example: string;
  energyTip: string;
  type: 'residential' | 'commercial';
}> = {
  pat: {
    name: 'Pat Gallagher',
    tone: 'warm, steady, practical, motherly, no hype',
    regionalStyle: 'warm, understated phrasing, approachable and grounded',
    example: 'Winters get rough out here, so anything that keeps the house steady is worth considering.',
    energyTip: 'Home Energy Savings',
    type: 'residential',
  },
  ernie: {
    name: 'Ernie Brown',
    tone: 'direct, concise, practical, cost-focused',
    regionalStyle: 'no-nonsense directness, short and plain phrasing',
    example: "If it cuts the bill a little, that's all I need to hear.",
    energyTip: 'Energy Assessment',
    type: 'residential',
  },
  aaliyah: {
    name: 'Aaliyah Torres',
    tone: 'modern, friendly, lightly energetic, approachable',
    regionalStyle: 'casual but clear, youthful and energetic phrasing',
    example: 'With the weather jumping around here, little energy saves can really make things easier day to day.',
    energyTip: 'Home Performance',
    type: 'residential',
  },
  sam: {
    name: 'Sam Osei',
    tone: 'steady, practical, ROI-focused, businesslike but friendly',
    regionalStyle: 'balanced, professional tone, measured phrasing',
    example: 'Keeping things running efficiently is one of the easiest ways to avoid surprise expenses.',
    energyTip: 'Home Performance',
    type: 'commercial',
  },
};

// Location-based energy tip overrides (mirrors generate-message/route.ts)
const getEnergyTipForLocation = (loc: string | undefined): string | null => {
  const l = (loc || '').toLowerCase();
  if (l.includes('chicago')) return 'Home Energy Savings';
  if (l.includes('philadelphia') || l.includes('philly')) return 'Energy Assessment';
  if (
    l.includes('baltimore') || l.includes('maryland') ||
    l.includes('northern virginia') || l.includes('dmv') || l.includes('dc') ||
    (l.includes('washington') && !l.includes('state'))
  ) return 'Home Performance';
  return null;
};

// ── Message helpers ───────────────────────────────────────────────────────────

const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(w => w.length > 0).length;

const truncateTo35Words = (text: string) => {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  return words.length <= 35 ? text : words.slice(0, 35).join(' ') + '...';
};

const sensitiveWords = [
  'slavery', 'slave', 'civil war', 'massacre', 'segregation', 'protest', 'riot',
  'disaster', 'hurricane', 'killed', 'destroyed', 'burned', 'bomb', 'war',
  'shooting', 'tragedy',
];

const checkForSensitiveWords = (text: string) =>
  sensitiveWords.some(word => text.toLowerCase().includes(word.toLowerCase()));

const formatMessage = (raw: string) => {
  let msg = raw;
  const m = raw.match(/Message:\s*([\s\S]+?)$/i);
  if (m) msg = m[1].trim();
  msg = msg.replace(/^Location:\s*[^\n]+\n?/gi, '');
  msg = msg.replace(/\nLocation:\s*[^\n]+/gi, '');
  msg = msg.replace(/^['"]+|['"]+$/g, '');
  msg = msg.replace(/'/g, '\u2019');
  msg = msg.replace(/\s*—\s*/g, ', ');
  if (countWords(msg) > 35) msg = truncateTo35Words(msg);
  return msg;
};

const checkModeration = async (text: string): Promise<{ flagged: boolean; reason?: string }> => {
  try {
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({ input: text }),
    });
    if (!res.ok) return { flagged: false };
    const data = await res.json();
    const result = data.results?.[0];
    if (result?.flagged) {
      const cats = Object.entries(result.categories || {})
        .filter(([, v]) => v).map(([k]) => k);
      return { flagged: true, reason: `flagged by moderation API (categories: ${cats.join(', ')})` };
    }
    return { flagged: false };
  } catch {
    return { flagged: false };
  }
};

// ── Core message generator ────────────────────────────────────────────────────

async function generateMessage(
  latitude: number,
  longitude: number,
  audience: string,
  locationName?: string,
): Promise<string> {
  // Fetch weather
  const weatherRes = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=imperial`
  );
  if (!weatherRes.ok) throw new Error('Failed to fetch weather');

  const weatherData = await weatherRes.json();
  const location = locationName || weatherData.name;
  const temperature = Math.round(weatherData.main.temp);
  const weatherDescription = weatherData.weather[0].description;

  const timezoneOffset = weatherData.timezone || 0;
  const localTime = new Date(Date.now() + timezoneOffset * 1000);
  const localTimeString = localTime.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const persona = personaConfig[audience] || personaConfig.pat;
  const locationBasedTip = getEnergyTipForLocation(location);
  const energyTipText = (locationBasedTip ?? persona.energyTip) + ' Program';

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
- You MUST include the exact program name "${energyTipText}" in the message (e.g., "check out Home Energy Savings Program", "explore Energy Assessment Program"). Do NOT use generic phrases like "energy-efficient updates" or "energy savings" without naming the program "${energyTipText}".
- ${persona.type === 'commercial' ? 'Keep the message business-focused and ROI-oriented, but still friendly.' : 'Keep the message home-focused and practical, emphasizing comfort and savings.'}

IMPORTANT MESSAGE STRUCTURE:
- Lead with location-specific observations or context about ${location}
- Use weather and time as the lens through which you talk about ${location} (e.g., "In ${location}, when it's [condition], [location-specific insight]")
- Reference the weather conditions naturally to inform what you say about ${location} without explicitly stating the temperature or time
- Write like a smart local with a sense of humor, not a corporate marketer. Prioritize wit, insight, or natural observation over symmetry or sales tone.
- DO NOT use or reference any sensitive, tragic, or controversial historical events or topics (e.g., war, slavery, colonialism, racism, natural disasters, or crimes).
- Keep the message friendly, practical, and relatable
- DO NOT explicitly state the current time or temperature - use them as context to form your message about the location
- CRITICAL: When referring to the location, use NATURAL, CONVERSATIONAL language. People say "In Baltimore" or "Baltimore" or "around here" - NEVER say "In Baltimore, Maryland" or "Baltimore, Maryland" in the actual message. Only use the city name, not "City, State" format.

The message should be:
- 1–2 sentences total
- AT MOST 35 WORDS (this is a hard limit - count your words carefully)
- Written in ${persona.name}'s voice and tone (${persona.tone})
- CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text itself.
- Clever, conversational, and human
- Primarily focused on ${location}, using current conditions to inform what you say about it
- Lightly persuasive, ending on a relatable energy-savings note
- DO NOT use any M-dashes (—) in the message

Tone (MUST MATCH ${persona.name.toUpperCase()}):
${persona.tone}
${persona.regionalStyle}
Avoid marketing clichés, rhymes, or obvious puns ("sizzle," "shine bright," "race to savings").
Humor should come from connection, contrast, or surprise, not wordplay.
The goal is to make ${persona.name} think, "That makes sense," not "Okay, cute line."
Your message should always be friendly and inclusive.
If humor risks sounding dark, insensitive, or sarcastic about serious subjects, do not use it.

Style:
The message should be ABOUT ${location} first and foremost. Use weather and time context to inform what you say about ${location}.
Then pivot naturally into naming the program "${energyTipText}" — not a pun, and not a generic phrase instead of the program name.
Keep it short and human: 1–2 sentences max.
The line should sound natural if read aloud, like something overheard on a local radio segment or between neighbors.

Examples matching ${persona.name}'s tone:
"${persona.example}"

Current context (use these to FORM your message about ${location}, but don't explicitly state these):
- Location: ${location} (THIS IS THE PRIMARY FOCUS)
- Local time: ${localTimeString}
- Temperature: ${temperature}°F
- Weather: ${weatherDescription}

Output format:
You must output ONLY the message text itself - nothing else. Do NOT include "Location:" or "Message:" labels. Just output the actual message text.

CRITICAL: When referring to the location in the message, use ONLY the city name - NEVER "City, State" format.
CRITICAL: DO NOT include the persona name "${persona.name}" or "${persona.name.split(' ')[0]}" anywhere in the message text.
CRITICAL: Output ONLY the message text - do NOT include any labels like "Location:" or "Message:" in your response.`;

  const callAI = async (temperature: number, extraInstruction?: string) => {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: extraInstruction ? prompt + '\n\n' + extraInstruction : prompt }],
        max_tokens: 80,
        temperature,
      }),
    });
    if (!res.ok) throw new Error('OpenAI request failed');
    const data = await res.json();
    return formatMessage(data.choices?.[0]?.message?.content?.trim() || 'Have a wonderful day!');
  };

  let message = await callAI(0.8);
  let attempts = 1;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    // 1. Moderation check
    const modCheck = await checkModeration(message);
    if (modCheck.flagged) {
      attempts++;
      message = await callAI(
        0.7 + attempts * 0.1,
        `IMPORTANT: The previous response was ${modCheck.reason}. This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that passes content moderation and is AT MOST 35 WORDS. Must be primarily about ${location} and include the exact program name "${energyTipText}". Do NOT include the persona name "${persona.name}".`
      );
      continue;
    }

    // 2. Sensitive words check
    if (checkForSensitiveWords(message)) {
      attempts++;
      message = await callAI(
        0.7 + attempts * 0.1,
        `IMPORTANT: The previous response contained sensitive content. This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that avoids sensitive topics and is AT MOST 35 WORDS. Must be primarily about ${location} and include the exact program name "${energyTipText}". Do NOT include the persona name "${persona.name}".`
      );
      continue;
    }

    // 3. Word count check
    if (countWords(message) > 35) {
      attempts++;
      message = await callAI(
        0.7 + attempts * 0.1,
        `IMPORTANT: The previous response exceeded 35 words. This is attempt ${attempts} of ${maxAttempts}. Generate a completely different message that is AT MOST 35 WORDS. Must be primarily about ${location} and include the exact program name "${energyTipText}". Do NOT include the persona name "${persona.name}".`
      );
      continue;
    }

    break; // all checks passed
  }

  return message;
}

// ── GET handler ───────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
      (req.headers.get('host') ? `https://${req.headers.get('host')}` : 'http://localhost:3000');

    const url = new URL(req.url);
    const lat = url.searchParams.get('lat');
    const lng = url.searchParams.get('lng');
    const locationName = url.searchParams.get('location') || undefined;
    const persona = url.searchParams.get('persona') || 'pat';

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
    };

    if (!lat || !lng) {
      const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Smart Billboard Messages</title>
    <description>Location-based energy efficiency messages from the Smart Billboard system.</description>
    <link>${baseUrl}</link>
    <item>
      <title>Location Required</title>
      <description><![CDATA[Please provide latitude and longitude parameters. Use: /feed?lat=40.7128&lng=-74.0060&persona=pat]]></description>
      <link>${baseUrl}</link>
      <guid isPermaLink="true">${baseUrl}/feed?error=location-required</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;
      return new NextResponse(errorRss, {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders },
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const message = await generateMessage(latitude, longitude, persona, locationName);
    const pubDate = new Date().toUTCString();
    const displayLocation = locationName || `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

    const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Smart Billboard Message - ${displayLocation}</title>
    <description>Latest energy efficiency message for ${displayLocation} (persona: ${persona}).</description>
    <link>${baseUrl}</link>
    <item>
      <title>Smart Billboard Message - ${displayLocation}</title>
      <description><![CDATA[${message}]]></description>
      <link>${baseUrl}?lat=${lat}&amp;lng=${lng}</link>
      <guid isPermaLink="true">${baseUrl}/feed?lat=${lat}&amp;lng=${lng}&amp;persona=${persona}&amp;t=${Date.now()}</guid>
      <pubDate>${pubDate}</pubDate>
    </item>
  </channel>
</rss>`;

    return new NextResponse(rssContent, {
      status: 200,
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Error generating RSS feed', { status: 500 });
  }
}
