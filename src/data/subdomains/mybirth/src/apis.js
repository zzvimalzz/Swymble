/* ============================================================
   apis.js — live, key-free data sources.
     • Open-Meteo geocoding   → lat/lon for a place name
     • Open-Meteo archive     → real historical daily weather (from 1940)
     • Wikipedia "on this day" → real events & births for a date
   Every call fails soft: a rejected/empty response never breaks
   the page, it just hides that section.
   ============================================================ */

const TIMEOUT = 9000;

async function getJSON(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(url, { signal: ctrl.signal, ...opts });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/* ---------- geocoding ---------- */
export async function geocode(place) {
  if (!place) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      place
    )}&count=1&language=en&format=json`;
    const data = await getJSON(url);
    const r = data?.results?.[0];
    if (!r) return null;
    return {
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      country: r.country,
      countryCode: r.country_code,
      timezone: r.timezone
    };
  } catch {
    return null;
  }
}

/* ---------- country facts (Wikipedia summary + flag emoji, key-free) ---------- */
// REST Countries now 301-redirects to a static file and drops the country
// code, so we use Wikipedia's reliable, CORS-friendly page summary instead.
export function flagEmoji(code) {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export async function countryFacts(code, name) {
  const flag = flagEmoji(code);
  if (!name) return null;
  try {
    const data = await getJSON(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
    );
    return {
      name: data?.title || name,
      flag,
      thumb: data?.thumbnail?.source || null,
      extract: data?.extract || null,
      description: data?.description || null
    };
  } catch {
    return { name, flag, thumb: null, extract: null, description: null };
  }
}

/* ---------- historical weather ---------- */
export async function historicalWeather(lat, lon, isoDate) {
  if (lat == null || lon == null) return null;
  try {
    const url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
      `&start_date=${isoDate}&end_date=${isoDate}` +
      `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,` +
      `windspeed_10m_max,weathercode&timezone=auto`;
    const data = await getJSON(url);
    const dly = data?.daily;
    if (!dly || dly.time?.length === 0 || dly.temperature_2m_mean?.[0] == null) return null;
    return {
      max: dly.temperature_2m_max?.[0],
      min: dly.temperature_2m_min?.[0],
      mean: dly.temperature_2m_mean?.[0],
      precip: dly.precipitation_sum?.[0],
      wind: dly.windspeed_10m_max?.[0],
      code: dly.weathercode?.[0],
      ...describeWeather(dly.weathercode?.[0])
    };
  } catch {
    return null;
  }
}

// WMO weather interpretation codes → words + glyph
function describeWeather(code) {
  const map = {
    0: ["Clear sky", "☀️"],
    1: ["Mainly clear", "🌤️"],
    2: ["Partly cloudy", "⛅"],
    3: ["Overcast", "☁️"],
    45: ["Foggy", "🌫️"],
    48: ["Rime fog", "🌫️"],
    51: ["Light drizzle", "🌦️"],
    53: ["Drizzle", "🌦️"],
    55: ["Heavy drizzle", "🌧️"],
    61: ["Light rain", "🌦️"],
    63: ["Rain", "🌧️"],
    65: ["Heavy rain", "🌧️"],
    71: ["Light snow", "🌨️"],
    73: ["Snow", "🌨️"],
    75: ["Heavy snow", "❄️"],
    77: ["Snow grains", "🌨️"],
    80: ["Rain showers", "🌦️"],
    81: ["Showers", "🌧️"],
    82: ["Violent showers", "⛈️"],
    85: ["Snow showers", "🌨️"],
    86: ["Heavy snow showers", "❄️"],
    95: ["Thunderstorm", "⛈️"],
    96: ["Storm w/ hail", "⛈️"],
    99: ["Severe storm", "🌩️"]
  };
  const [summary, glyph] = map[code] || ["Unrecorded skies", "🌗"];
  return { summary, glyph };
}

/* ---------- Wikipedia: people who share the date ---------- */
export async function onThisDay(month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${mm}/${dd}`;
    const data = await getJSON(url);
    return {
      births: shapePeople(data?.births, 9),
      deaths: shapePeople(data?.deaths, 5)
    };
  } catch {
    return null;
  }
}

function shapePeople(list, n) {
  const people = (list || [])
    .filter((p) => p.text && p.year)
    .map((p) => {
      const page = p.pages?.[0];
      return {
        year: p.year,
        name: (p.text.split(/,| – | — /)[0] || p.text).trim(),
        desc: page?.description || cleanDesc(p.text),
        thumb: page?.thumbnail?.source || null,
        url: page?.content_urls?.desktop?.page || null
      };
    });
  // prefer entries that have a portrait, then sample across time for variety
  const withImg = people.filter((p) => p.thumb);
  const pool = withImg.length >= n ? withImg : people;
  return sample(pool.sort((a, b) => a.year - b.year), n);
}

function cleanDesc(text) {
  const parts = text.split(/,(.+)/);
  return (parts[1] || "").replace(/\s+/g, " ").trim().slice(0, 80);
}

function sample(arr, n) {
  if (arr.length <= n) return arr;
  const step = arr.length / n, out = [];
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

/* ---------- Wikipedia: what happened that YEAR (world + your country) ---------- */
// Parses the "Events" list out of the "<year>" and "<year> in <country>"
// articles, then tags each line as brighter / harder / notable.
export async function yearEvents(year, countryName) {
  const localTitles = countryName
    ? [`${year} in ${countryName}`, `${year} in the ${countryName}`]
    : [];
  const [world, ...localTries] = await Promise.all([
    articleEvents(String(year)),
    ...localTitles.map((t) => articleEvents(t))
  ]);
  const local = localTries.find((arr) => arr.length) || [];
  return {
    world: world.map((text) => ({ text, mood: classifyMood(text) })),
    local: local.map((text) => ({ text, mood: classifyMood(text) }))
  };
}

async function articleEvents(title) {
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}` +
      `&prop=text&format=json&redirects=1&origin=*`;
    const data = await getJSON(url);
    const html = data?.parse?.text?.["*"];
    if (!html) return [];

    const doc = new DOMParser().parseFromString(html, "text/html");
    const root = doc.querySelector(".mw-parser-output") || doc.body;

    const lis = [];
    let inEvents = false;
    for (const el of [...root.children]) {
      const isH2 = el.tagName === "H2" || (el.classList?.contains("mw-heading") && el.querySelector("h2"));
      if (isH2) {
        const txt = (el.textContent || "").replace(/\[edit\]/i, "").trim();
        if (/^events/i.test(txt)) { inEvents = true; continue; }
        if (inEvents) break; // next top-level section closes Events
      }
      if (inEvents && el.tagName === "UL") {
        el.querySelectorAll(":scope > li").forEach((li) => lis.push(li));
      }
    }
    // fallback: the first list in the article body
    if (!lis.length) {
      const ul = root.querySelector("ul");
      if (ul) ul.querySelectorAll(":scope > li").forEach((li) => lis.push(li));
    }

    return lis.map(cleanLi).filter(Boolean);
  } catch {
    return [];
  }
}

function cleanLi(li) {
  const c = li.cloneNode(true);
  c.querySelectorAll("sup, .mw-editsection, style, .reference").forEach((n) => n.remove());
  const t = (c.textContent || "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
  if (t.length < 12 || t.length > 240) return null;
  return t;
}

const BAD = /\b(war|wars|killed?|kills|dies|died|dead|deaths?|earthquake|disaster|crash(?:es)?|bomb(?:ing|ed)?|attacks?|massacre|genocide|assassinat\w*|flood\w*|famine|riots?|terror\w*|hurricane|tsunami|cyclone|explosion|shoot\w*|coup|invad\w*|invasion|conflict|outbreak|epidemic|pandemic|collaps\w*|wildfire|murder\w*|hostage|sank|sinks?|sinking|wounded|injur\w*|violence|drought|recession|crisis|scandal|overthrow\w*|execut\w*|protest\w*)\b/i;
const GOOD = /\b(first|founded|found|opens?|opened|launch\w*|wins?|won|peace|treaty|independence|independent|discover\w*|premieres?|debut\w*|complet\w*|elect\w*|establish\w*|records?|awards?|awarded|unveil\w*|releases?|released|celebrat\w*|inaugurat\w*|signed|breakthrough|championship|reopen\w*|restor\w*|reunit\w*|liberat\w*|introduc\w*|breaks the record)\b/i;

export function classifyMood(text) {
  if (BAD.test(text)) return "bad";
  if (GOOD.test(text)) return "good";
  return "neutral";
}
