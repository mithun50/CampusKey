# CampusKey

Your college ID and email unlock more than you think.

CampusKey is a simple, mobile friendly guide to the student offers you can claim in India with a college ID card or a college email address. It covers developer tools, cloud credits, AI and productivity apps, design and engineering software, entertainment subscriptions, hardware discounts, travel concessions, government schemes and campus programs.

Every offer lists:

- what you get and its approximate value
- who can claim it
- the proof you need (college email, ID card, bonafide certificate and so on)
- step by step instructions to claim it
- the official link and the sources that were checked
- whether it is confirmed for India, plus a confidence level

## Features

- Search, category chips, a "what do you have" filter (college email or ID card) and sorting
- Detail sheet that slides up on phones, with deep links you can share (for example `#github-student-developer-pack`)
- The Android back button closes the sheet instead of leaving the page
- Built for Android screens from 360px wide and up, with 44px tap targets and no horizontal scrolling
- Light and dark mode, keyboard accessible, skip link, semantic HTML
- No framework, no tracking, no build step. Plain HTML, CSS and JavaScript

## Run locally

```bash
npm install
npm start
```

Then open http://127.0.0.1:4173. You can also open `index.html` directly in a browser.

## Tests

```bash
npx playwright install chromium
npm test
```

`npm test` first runs `scripts/validate-data.js`, which checks every offer for required fields, https links and unique ids, and scans the site for emojis and en or em dashes. It then runs Playwright end to end tests on desktop Chrome and four Android device profiles (Galaxy S8, Galaxy S9+, Pixel 7 and Galaxy Tab S4).

## Updating offers

All offer data lives in `data/offers.js`. Each entry follows the same shape, so adding or correcting an offer is a single edit. Update the `checked` date at the top when you re-verify, then run `npm test`.

## Disclaimer

CampusKey is an independent guide and is not affiliated with any company listed. Offers change often. Always confirm the price and eligibility on the official page before you pay or upload documents, and only upload your ID on the provider's own site or its named verification partner.

## License

MIT
