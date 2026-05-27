# Fight Ledger

A dependency-free boxing web app for tracking upcoming fights, previous bouts, and results.

## Features

- Upcoming and previous fight filters
- Search by fighter, venue, division, title, or result
- Delete fights
- Browser storage persistence
- Ranked fight feed for the previous and upcoming three-month window
- Static files that can be hosted on GitHub Pages

## Ranked fight data

The app can load `data/ranked-fights.json`, which is designed to be refreshed by
`scripts/update-ranked-fights.mjs`. The updater checks web sources for ranked
fighters and fight schedules, then keeps fights within a three-month previous or
upcoming window where at least one fighter is ranked in the top 20 of the
relevant weight class.

Once this is published to GitHub, the included GitHub Actions workflow can update
the JSON feed daily or on demand.

## Run locally

Open `index.html` in a browser.

## Publish with GitHub Pages

Create a new GitHub repository, upload these files, then enable GitHub Pages from the repository settings using the `main` branch and root folder.
