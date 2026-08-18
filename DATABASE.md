# F1 Grid Explorer — Database & Admin

The project now uses SQLite through Node's built-in `node:sqlite` module. No MongoDB server is required.

## First run

1. Install Node.js 22.5+.
2. Run `npm install`.
3. Run `npm run db:seed` if you want to recreate the database from the seed data.
4. Run `npm run dev`.
5. Open `http://localhost:5173`.

The database is stored at `server/f1-grid.sqlite` by default.

## Admin Access

Admin credentials are configured through environment variables.

Create a local `.env` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
APP_ORIGIN=http://localhost:5173

Change the password immediately from the Admin panel.

The Admin panel can edit drivers, teams, circuits, flags, sessions, rules, strategies, tyres, glossary terms, history/regulation records and championship lists. Changes are saved directly to SQLite.

The **Sync driver data** button refreshes driver statistics from the Jolpica F1 public results API. No driver photographs or media URLs are cached. The application stores the date/source of the last statistics update.

## Media

Driver, team and historic-driver visual slots are text-only. No third-party photographs are downloaded, hot-linked or stored in SQLite. Circuit layout schematics are treated separately as licensed/open-data visualizations.
