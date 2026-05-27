const sampleFights = [
  {
    id: crypto.randomUUID(),
    fighterA: "Oleksandr Usyk",
    fighterB: "Tyson Fury",
    fighterARecord: "22-0-0",
    fighterBRecord: "34-1-1",
    fighterAImage:
      "https://images.unsplash.com/photo-1593352216920-61ed7f8c8b6c?auto=format&fit=crop&w=600&q=80",
    fighterBImage:
      "https://images.unsplash.com/photo-1544717301-9cdcb1f5940f?auto=format&fit=crop&w=600&q=80",
    date: "2024-05-18",
    division: "Heavyweight",
    venue: "Kingdom Arena, Riyadh",
    locationImage:
      "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=900&q=80",
    title: "Undisputed heavyweight title",
    result: "Usyk def. Fury by split decision",
  },
  {
    id: crypto.randomUUID(),
    fighterA: "Naoya Inoue",
    fighterB: "Luis Nery",
    fighterARecord: "27-0-0",
    fighterBRecord: "35-2-0",
    fighterAImage:
      "https://images.unsplash.com/photo-1567013127542-490d757e51fc?auto=format&fit=crop&w=600&q=80",
    fighterBImage:
      "https://images.unsplash.com/photo-1583473848882-f9a5bc7fd2ee?auto=format&fit=crop&w=600&q=80",
    date: "2024-05-06",
    division: "Super bantamweight",
    venue: "Tokyo Dome, Tokyo",
    locationImage:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80",
    title: "Undisputed super bantamweight title",
    result: "Inoue def. Nery by KO in round 6",
  },
  {
    id: crypto.randomUUID(),
    fighterA: "Katie Taylor",
    fighterB: "Amanda Serrano",
    fighterARecord: "24-1-0",
    fighterBRecord: "47-3-1",
    fighterAImage:
      "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?auto=format&fit=crop&w=600&q=80",
    fighterBImage:
      "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?auto=format&fit=crop&w=600&q=80",
    date: "2026-07-11",
    division: "Super lightweight",
    venue: "Madison Square Garden, New York",
    locationImage:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=900&q=80",
    title: "Championship rematch",
    result: "",
  },
  {
    id: crypto.randomUUID(),
    fighterA: "Gervonta Davis",
    fighterB: "Shakur Stevenson",
    fighterARecord: "30-0-1",
    fighterBRecord: "22-0-0",
    fighterAImage:
      "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80",
    fighterBImage:
      "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80",
    date: "2026-09-19",
    division: "Lightweight",
    venue: "TBA",
    locationImage:
      "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&w=900&q=80",
    title: "Lightweight title fight",
    result: "",
  },
];

const storageKey = "fight-ledger-fights";
const fightList = document.querySelector("#fightList");
const emptyState = document.querySelector("#emptyState");
const searchInput = document.querySelector("#searchInput");
const loadRankedButton = document.querySelector("#loadRankedButton");
const dataStatus = document.querySelector("#dataStatus");
const panelTitle = document.querySelector("#panelTitle");
const tabs = document.querySelectorAll(".tab");

let activeFilter = "all";
let fights = loadFights();

function loadFights() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : sampleFights;
}

function saveFights() {
  localStorage.setItem(storageKey, JSON.stringify(fights));
}

function getFightStatus(fight) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${fight.date}T00:00:00`) >= today && !fight.result
    ? "upcoming"
    : "previous";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function getVisibleFights() {
  const query = searchInput.value.trim().toLowerCase();

  return fights
    .filter((fight) => activeFilter === "all" || getFightStatus(fight) === activeFilter)
    .filter((fight) => {
      const haystack = Object.values(fight).join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => {
      const first = new Date(`${a.date}T00:00:00`);
      const second = new Date(`${b.date}T00:00:00`);
      return activeFilter === "previous" ? second - first : first - second;
    });
}

function renderStats() {
  const upcoming = fights.filter((fight) => getFightStatus(fight) === "upcoming").length;
  const previous = fights.length - upcoming;
  const divisions = new Set(fights.map((fight) => fight.division.toLowerCase())).size;

  document.querySelector("#upcomingCount").textContent = upcoming;
  document.querySelector("#previousCount").textContent = previous;
  document.querySelector("#divisionCount").textContent = divisions;
}

function renderFights() {
  const visibleFights = getVisibleFights();
  fightList.innerHTML = "";
  emptyState.hidden = visibleFights.length > 0;
  panelTitle.textContent =
    activeFilter === "all"
      ? "All fights"
      : activeFilter === "upcoming"
        ? "Upcoming fights"
        : "Previous results";

  visibleFights.forEach((fight) => {
    const status = getFightStatus(fight);
    const card = document.createElement("article");
    card.className = "fight-card";
    card.innerHTML = `
      <div>
        <span class="status-pill ${status}">${status}</span>
        ${fight.rankedMatch ? '<span class="ranked-pill">Top 20 match</span>' : ""}
        <h3>${escapeHtml(fight.fighterA)} vs ${escapeHtml(fight.fighterB)}</h3>
        <div class="fighter-matchup">
          ${renderFighter(fight.fighterA, fight.fighterARecord, fight.fighterAImage)}
          <span class="versus">vs</span>
          ${renderFighter(fight.fighterB, fight.fighterBRecord, fight.fighterBImage)}
        </div>
        <p class="fight-meta">
          ${formatDate(fight.date)} · ${escapeHtml(fight.division)}<br />
          ${escapeHtml(fight.venue || "Venue TBA")} · ${escapeHtml(fight.title || "Bout")}
        </p>
        <p class="fight-result">${
          fight.result ? escapeHtml(fight.result) : "Result pending"
        }</p>
        ${renderSourceLink(fight)}
      </div>
      <div class="location-preview">
        ${renderLocationImage(fight)}
        <p>${escapeHtml(fight.venue || "Venue TBA")}</p>
      </div>
      <div class="card-actions">
        <button class="delete-button" type="button" title="Delete fight" aria-label="Delete fight" data-id="${
          fight.id
        }">×</button>
      </div>
    `;
    fightList.append(card);
  });

  renderStats();
}

function renderFighter(name, record, image) {
  const safeName = escapeHtml(name);
  const hasRecord = record && record !== "Record TBA";

  return `
    <div class="fighter-profile">
      ${renderFighterImage(name, image)}
      <strong>${safeName}</strong>
      ${hasRecord ? `<span>${escapeHtml(record)}</span>` : ""}
    </div>
  `;
}

function renderFighterImage(name, image) {
  const initials = getInitials(name);

  if (image) {
    return `
      <div class="fighter-photo">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" />
        <span aria-hidden="true">${initials}</span>
      </div>
    `;
  }

  return `<div class="fighter-initials" aria-hidden="true">${initials}</div>`;
}

function renderLocationImage(fight) {
  if (fight.locationImage) {
    return `
      <div class="location-photo">
        <img src="${escapeHtml(fight.locationImage)}" alt="${escapeHtml(
          fight.venue || "Fight location",
        )}" loading="lazy" />
        <span aria-hidden="true">Location TBA</span>
      </div>
    `;
  }

  return `<div class="location-fallback" aria-hidden="true">Location TBA</div>`;
}

function renderSourceLink(fight) {
  if (!fight.sourceUrl) return "";
  return `<a class="source-link" href="${escapeHtml(fight.sourceUrl)}" target="_blank" rel="noreferrer">Source</a>`;
}

function getInitials(name) {
  return escapeHtml(
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderFights();
  });
});

searchInput.addEventListener("input", renderFights);

fightList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-button");
  if (!button) return;

  fights = fights.filter((fight) => fight.id !== button.dataset.id);
  saveFights();
  renderFights();
});

loadRankedButton.addEventListener("click", loadRankedFeed);

async function loadRankedFeed() {
  loadRankedButton.disabled = true;
  dataStatus.textContent = "Loading ranked web data...";

  try {
    const response = await fetch("data/ranked-fights.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Ranked fight data is not available yet.");

    const payload = await response.json();
    fights = payload.fights.map((fight) => ({
      id: fight.id || crypto.randomUUID(),
      ...fight,
    }));
    saveFights();
    dataStatus.textContent = `Ranked feed updated ${formatDate(payload.generatedAt.slice(0, 10))}`;
    renderFights();
  } catch (error) {
    dataStatus.textContent = error.message;
  } finally {
    loadRankedButton.disabled = false;
  }
}

document.addEventListener(
  "error",
  (event) => {
    if (event.target.matches(".fighter-photo img, .location-photo img")) {
      event.target.parentElement.classList.add("image-missing");
    }
  },
  true,
);

loadRankedFeed();
