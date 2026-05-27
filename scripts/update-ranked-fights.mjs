import { mkdir, writeFile } from "node:fs/promises";

const generatedAt = new Date();
const previousWindow = shiftMonths(generatedAt, -3);
const upcomingWindow = shiftMonths(generatedAt, 3);

const divisions = [
  "heavyweight",
  "cruiserweight",
  "light-heavyweight",
  "super-middleweight",
  "middleweight",
  "super-welterweight",
  "welterweight",
  "super-lightweight",
  "lightweight",
  "super-featherweight",
  "featherweight",
  "super-bantamweight",
  "bantamweight",
  "super-flyweight",
  "flyweight",
  "light-flyweight",
  "strawweight",
];

const sources = {
  rankingsBase: "https://www.boxingmetrics.com/weightclass",
  skySchedule:
    "https://www.skysports.com/boxing/news/12183/13491463/boxing-2026-fight-schedule-and-latest-results-tyson-fury-oleksandr-usyk-katie-taylor-and-more",
};

const rankedByName = new Map();
const fights = [];
const manualFights = [
  {
    fighterA: "Jesse Rodriguez",
    fighterB: "Antonio Vargas",
    fighterARecord: "23-0-0",
    fighterBRecord: "19-1-1",
    date: "2026-06-13",
    division: "Bantamweight",
    venue: "Desert Diamond Arena, Glendale, AZ",
    locationImage:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
    title: "WBA World Bantamweight Title",
    result: "",
    rankedMatch: true,
    rankedFighters: ["Jesse Rodriguez", "Antonio Vargas"],
    sourceName: "Matchroom Boxing / ESPN",
    sourceUrl: "https://www.matchroomboxing.com/events/rodriguez-vs-vargas/",
  },
];

for (const divisionSlug of divisions) {
  const url = `${sources.rankingsBase}/${divisionSlug}`;
  const text = toText(await fetchText(url));
  const division = titleCase(divisionSlug.replaceAll("-", " "));

  parseDivisionRankings(text, division)
    .slice(0, 20)
    .forEach((fighter, index) => {
      rankedByName.set(normalizeName(fighter.name), {
        ...fighter,
        rank: index + 1,
        division,
      });
    });

  parseRecentFights(text, division, url).forEach((fight) => {
    if (isInsideWindow(fight.date) && hasRankedFighter(fight)) {
      fights.push(enrichFight(fight));
    }
  });
}

const scheduleText = toText(await fetchText(sources.skySchedule));
parseSkySchedule(scheduleText, sources.skySchedule).forEach((fight) => {
  if (isInsideWindow(fight.date) && hasRankedFighter(fight)) {
    fights.push(enrichFight(fight));
  }
});

manualFights.forEach((fight) => {
  if (isInsideWindow(fight.date)) {
    fights.push({
      id: makeId(`${fight.fighterA}-${fight.fighterB}-${fight.date}`),
      fighterAImage: "",
      fighterBImage: "",
      ...fight,
    });
  }
});

await mkdir("data", { recursive: true });
await writeFile(
  "data/ranked-fights.json",
  `${JSON.stringify(
    {
      generatedAt: generatedAt.toISOString(),
      window: {
        previousMonths: 3,
        upcomingMonths: 3,
      },
      criteria:
        "Include fights inside the three-month previous or upcoming window where at least one fighter is ranked in the top 20 of the relevant weight class.",
      sources: Object.values(sources),
      fights: dedupeFights(fights).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    },
    null,
    2,
  )}\n`,
);

function parseDivisionRankings(text, division) {
  const rankingsSection = sectionBetween(text, "P4P Rankings (Division)", "Strength of Schedule");
  const matches = [...rankingsSection.matchAll(/([A-Z][A-Za-z .'-]+)\s+(?:[A-Za-z ]+)?\s+(\d+-\d+-\d+)/g)];

  return matches.map((match) => ({
    name: match[1].trim(),
    record: match[2],
    division,
  }));
}

function parseRecentFights(text, division, sourceUrl) {
  const recentSection = sectionBetween(text, "Recent Fights", "All Fighters in Division");
  const pattern =
    /([A-Z][a-z]{2} \d{2}, 2026)\s+([A-Z][A-Za-z .'-]+)\s+vs\s+([A-Z][A-Za-z .'-]+)\s+([^\n]+)/g;

  return [...recentSection.matchAll(pattern)].map((match) => ({
    fighterA: match[2].trim(),
    fighterB: match[3].trim(),
    date: toIsoDate(match[1]),
    division,
    venue: match[4].trim(),
    title: `${division} bout`,
    result: "Result listed by source",
    sourceName: "Boxing Metrics",
    sourceUrl,
  }));
}

function parseSkySchedule(text, sourceUrl) {
  const scheduleSection = sectionBetween(text, "Boxing 2026 Schedule - key upcoming fights", "Boxing 2026 Results");
  const lines = scheduleSection.split("\n").map((line) => line.trim()).filter(Boolean);
  const fights = [];
  let activeDate = "";

  for (const line of lines) {
    const dateMatch = line.match(/^(Saturday|Sunday|Monday|Tuesday|Wednesday|Thursday|Friday) ([A-Z][a-z]+ \d{1,2})$/);
    if (dateMatch) {
      activeDate = `${dateMatch[2]}, 2026`;
      continue;
    }

    const fightMatch = line.match(/^(.+?) vs (.+?)(?: \((.+?)\))? - (.+)$/);
    if (!fightMatch || !activeDate) continue;

    fights.push({
      fighterA: fightMatch[1].trim(),
      fighterB: fightMatch[2].trim(),
      date: toIsoDate(activeDate),
      division: inferDivision(fightMatch[3] || ""),
      venue: fightMatch[4].trim(),
      title: fightMatch[3] || "Bout",
      result: "",
      sourceName: "Sky Sports",
      sourceUrl,
    });
  }

  return fights;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Fight Ledger data updater (personal GitHub Pages app)",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.text();
}

function enrichFight(fight) {
  const rankedFighters = [fight.fighterA, fight.fighterB]
    .map((name) => rankedByName.get(normalizeName(name)))
    .filter(Boolean);

  return {
    id: makeId(`${fight.fighterA}-${fight.fighterB}-${fight.date}`),
    fighterA: fight.fighterA,
    fighterB: fight.fighterB,
    fighterARecord: rankedByName.get(normalizeName(fight.fighterA))?.record || "Record TBA",
    fighterBRecord: rankedByName.get(normalizeName(fight.fighterB))?.record || "Record TBA",
    fighterAImage: "",
    fighterBImage: "",
    date: fight.date,
    division: fight.division,
    venue: fight.venue,
    locationImage: "",
    title: fight.title,
    result: fight.result,
    rankedMatch: true,
    rankedFighters: rankedFighters.map((fighter) => fighter.name),
    sourceName: fight.sourceName,
    sourceUrl: fight.sourceUrl,
  };
}

function hasRankedFighter(fight) {
  return [fight.fighterA, fight.fighterB].some((name) => rankedByName.has(normalizeName(name)));
}

function isInsideWindow(date) {
  const fightDate = new Date(`${date}T00:00:00`);
  return fightDate >= previousWindow && fightDate <= upcomingWindow;
}

function dedupeFights(items) {
  return [...new Map(items.map((fight) => [fight.id, fight])).values()];
}

function sectionBetween(text, start, end) {
  const startIndex = text.indexOf(start);
  if (startIndex === -1) return "";
  const endIndex = text.indexOf(end, startIndex + start.length);
  return text.slice(startIndex, endIndex === -1 ? undefined : endIndex);
}

function toText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{2,}/g, "\n");
}

function toIsoDate(value) {
  return new Date(`${value} 00:00:00 UTC`).toISOString().slice(0, 10);
}

function normalizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferDivision(title) {
  const lower = title.toLowerCase();
  if (lower.includes("heavyweight")) return "Heavyweight";
  if (lower.includes("cruiserweight")) return "Cruiserweight";
  if (lower.includes("lightweight")) return "Lightweight";
  if (lower.includes("featherweight")) return "Featherweight";
  if (lower.includes("bantamweight")) return "Bantamweight";
  if (lower.includes("welterweight")) return "Welterweight";
  if (lower.includes("middleweight")) return "Middleweight";
  if (lower.includes("flyweight")) return "Flyweight";
  return "TBA";
}

function shiftMonths(date, months) {
  const shifted = new Date(date);
  shifted.setMonth(shifted.getMonth() + months);
  return shifted;
}

function titleCase(value) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
