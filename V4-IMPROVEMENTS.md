# F1 Grid Explorer v4.2 — focused fixes

1. Consistent driver portrait framing.
2. Circuit SVGs kept inside their frames.
3. Fastest qualifying lap removed; fastest race lap remains.
4. Search suggestion click navigation fixed.
5. Driver search results link directly to working profiles.
6. Admin logout and expiring sessions added.
7. Login rate limiting, security headers and CORS origin control added.
8. Automatic post-race-weekend synchronization added.
9. Current 2026 driver season stats refreshed to the latest verified official standings used for this package.

## v4.3 precision update
- Circuit SVGs are now displayed inside a smaller centered safe frame so the complete track remains above the description text on every circuit.
- Driver profile/card images use one consistent crop strategy and focal point.
- Top-right search suggestions navigate on mouse/touch press and the driver profile has an ID/name fallback resolver.
- Champions are flattened and sorted chronologically, one championship year per card.
- Historic-driver metadata enrichment now paginates the Jolpica API instead of requesting an unsupported 1000-row page; missing F1 debut is enriched on archive-driver detail and stored in SQLite.
- Strategy & Tyres now contains C1–C5 plus Intermediate and Full Wet, colour-coded with compound descriptions, illustrative stint ranges, and a 2026 weekend allocation panel.
- Fastest Qualifying Lap remains removed from circuit profiles; only Fastest Lap is shown.

## v4.5 Precision Update
- Circuit layout containers now reserve a dedicated safe area so the SVG cannot visually run into the circuit text block.
- World Championship year cards open a winner-details modal with available nationality, debut, date of birth and career statistics.
- Strategy & Tyres now separates tyre types (Hard, Medium, Soft, Intermediate, Full Wet) from the five 2026 slick compounds (C1-C5).
- C1-C5 cards show separate estimated stint ranges and explain how the Hard/Medium/Soft weekend labels are assigned to the selected compounds.
- Driver synchronization no longer double-counts 2026 wins, podiums or fastest laps.
- No driver/team/circuit photographs are stored or fetched. Circuit SVGs remain sourced from F1DB under CC BY 4.0 with attribution.
