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

/**
 * Live place search for the birthplace field.
 *
 * Open-Meteo's geocoder already backs every city, town and administrative
 * region on Earth, so the form searches it directly rather than shipping a
 * frozen list of countries and states that would always be incomplete.
 * Picking a suggestion hands the engine exact coordinates and an IANA
 * timezone, which is what sunrise and the historical weather actually need.
 */
export async function searchPlaces(query, count = 8) {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      q
    )}&count=${count}&language=en&format=json`;
    const data = await getJSON(url);
    return (data?.results || []).map((r) => ({
      id: r.id,
      lat: r.latitude,
      lon: r.longitude,
      name: r.name,
      admin1: r.admin1 || "",
      admin2: r.admin2 || "",
      country: r.country || "",
      countryCode: r.country_code || "",
      timezone: r.timezone || "",
      population: r.population || 0,
      /** "Kuala Lumpur, Kuala Lumpur, Malaysia" */
      label: [r.name, r.admin1, r.country].filter(Boolean).join(", "),
    }));
  } catch {
    return [];
  }
}

/* ---------- country facts (Wikipedia summary + flag emoji, key-free) ---------- */
// REST Countries now 301-redirects to a static file and drops the country
// code, so we use Wikipedia's reliable, CORS-friendly page summary instead.
/** A real flag image rather than a regional-indicator emoji, which renders
    inconsistently across platforms and reads as decoration next to the type. */
export function flagImage(code) {
  if (!code || code.length !== 2) return "";
  return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
}

export async function countryFacts(code, name) {
  const flag = flagImage(code);
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

/**
 * What the country was like the year you arrived, and what it is now.
 *
 * The World Bank's open data API is key-free, CORS-friendly and covers every
 * country, which is what lets this section say something specific about
 * Nigeria or Peru rather than only about the handful of places a curated
 * table would have reached.
 */
export async function countryIndicators(code, year) {
  if (!code || !year) return null;
  const series = async (indicator) => {
    try {
      const url = `https://api.worldbank.org/v2/country/${encodeURIComponent(code)}` +
        `/indicator/${indicator}?date=${year}:2024&format=json&per_page=120`;
      const data = await getJSON(url);
      return Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    } catch {
      return [];
    }
  };

  const [pop, life] = await Promise.all([
    series("SP.POP.TOTL"),
    series("SP.DYN.LE00.IN"),
  ]);
  const at = (rows, y) => rows.find((r) => r.date === String(y) && r.value != null)?.value ?? null;
  const newest = (rows) => rows.find((r) => r.value != null) || null;

  const then = at(pop, year);
  const latest = newest(pop);
  return {
    populationThen: then,
    populationNow: latest?.value ?? null,
    populationNowYear: latest?.date ?? null,
    lifeExpectancyThen: at(life, year),
  };
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
      // timezone=auto makes the archive resolve the real IANA zone for these
      // coordinates; a place picked off the bundled centroid table has none,
      // so this is the chance to upgrade its sunrise from a longitude guess
      timezone: data?.timezone || "",
      ...describeWeather(dly.weathercode?.[0])
    };
  } catch {
    return null;
  }
}

// WMO weather interpretation codes, mapped to words
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
  const entry = map[code];
  return { summary: Array.isArray(entry) ? entry[0] : entry || "Unrecorded skies" };
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
        // Wikipedia's own copy uses en and em dashes, so the splitter has to
      // know about them even though we never write one ourselves
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

/* ---------- Wikipedia: what happened that YEAR (world + Malaysia) ---------- */
// Parses the "Events" list out of the "<year>" and "<year> in Malaysia"
// articles, keeping the first linked article on each line as a source link.
export async function yearEvents(year) {
  const [world, malaysia] = await Promise.all([
    articleEvents(String(year)),
    articleEvents(`${year} in Malaysia`)
  ]);
  return {
    world: world.slice(0, 6),
    malaysia: malaysia.slice(0, 6)
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

// a bare date link ("January 1") isn't a useful source — prefer the next
// wikilink in the line, which is usually the actual subject of the event
const DATE_LINK_RE = /^\/wiki\/(January|February|March|April|May|June|July|August|September|October|November|December)_\d{1,2}$/;

function pickLink(c) {
  const anchors = [...c.querySelectorAll("a[href^='/wiki/']")];
  const chosen = anchors.find((a) => !DATE_LINK_RE.test(a.getAttribute("href"))) || anchors[0];
  return chosen ? `https://en.wikipedia.org${chosen.getAttribute("href")}` : null;
}

function cleanLi(li) {
  const c = li.cloneNode(true);
  c.querySelectorAll("sup, .mw-editsection, style, .reference").forEach((n) => n.remove());
  const url = pickLink(c);
  const t = (c.textContent || "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
  if (t.length < 12 || t.length > 240) return null;
  return { text: t, url };
}

/* ---------- space weather (NOAA SWPC, free, keyless, CORS-open) ---------- */
/*
   The one live feed on the Daily Sky.

   Everything else on that screen is computed here from orbital mechanics,
   which means it is knowable years ahead: true, but not news. The Sun is
   the opposite. Its activity is genuinely unpredictable, it changes by the
   hour, and NOAA publishes it as plain JSON with no key and no origin
   restriction. So it is the one thing on the page that nobody, including
   us, could have known yesterday.

   Kp is the planetary geomagnetic index, 0 to 9, reported every three
   hours. Failure is silent: the module simply does not appear.
*/
const KP_BANDS = [
  [0.5, "still", "The Earth's magnetic field is quiet."],
  [2.5, "settled", "The field is settled. Nothing much is arriving."],
  [3.5, "unsettled", "The field is unsettled: the solar wind is pushing on it."],
  [4.5, "active", "The field is active. Aurora is possible at high latitudes."],
  [5.5, "storming", "A minor geomagnetic storm is under way."],
  [6.5, "storming", "A moderate geomagnetic storm is under way."],
  [99, "storming", "A strong geomagnetic storm is under way."],
];

export async function spaceWeather() {
  try {
    const rows = await getJSON("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json");
    if (!Array.isArray(rows) || !rows.length) return null;
    const last = rows[rows.length - 1];
    /*
       SWPC is not consistent across its products: some return a header
       row followed by plain arrays, this one returns objects. Read either,
       because the shape is theirs to change and a silent null here would
       just make the module quietly stop appearing one day.
    */
    const kp = Number(Array.isArray(last) ? last[1] : (last?.Kp ?? last?.kp));
    if (!Number.isFinite(kp)) return null;
    const band = KP_BANDS.find(([max]) => kp < max) || KP_BANDS[KP_BANDS.length - 1];
    return { kp, state: band[1], line: band[2], at: Array.isArray(last) ? last[0] : last?.time_tag };
  } catch {
    return null;
  }
}
