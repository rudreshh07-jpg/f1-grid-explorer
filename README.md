# 🏎️ GRID — Formula Racing Explorer

> An independent full-stack Formula Racing explorer built with React, Vite, Node.js, Express and SQLite.

[![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)

---

## 📌 Overview

**GRID — Formula Racing Explorer** is an independent full-stack web application created as a software engineering portfolio project.

The application brings together current and historical Formula Racing information into an interactive interface covering:

- Drivers
- Teams / Constructors
- Circuits
- Championships
- F1 history
- Racing terminology
- Tyres
- Strategy
- Flags
- Sessions
- Rules
- Historical archives
- Administrative data management

The project was built to demonstrate practical experience with frontend development, backend development, database design, REST APIs, authentication, data processing and interactive UI/UX.

> **GRID is an independent educational and portfolio project. It is not affiliated with, endorsed by, sponsored by, or operated by Formula 1, the FIA, or any Formula 1 team.**

---

# ✨ Features

## 👨‍🏎️ Drivers

The Drivers section focuses on current Formula Racing drivers.

Driver profiles can include:

- Driver name
- Nationality
- Driver number
- Team
- Date of birth
- F1 debut
- Race wins
- Podiums
- Pole positions
- Championships
- Career statistics
- Other available driver information

### 🔎 Driver Search

The application provides interactive search suggestions while typing.

Users can:

- Search for drivers
- Search for teams
- Search for circuits
- View matching suggestions
- Select a suggestion
- Open the corresponding detail page

---

# 🏢 Teams

Team and constructor profiles provide structured information about racing teams.

Available information can include:

- Team name
- Nationality
- Team details
- Championship information
- Race wins
- Historical participation
- Other available statistics

Team information is retrieved through the application's backend and database.

---

# 🏁 Circuits

The Circuits section provides structured information about Formula Racing circuits.

Circuit profiles can include:

- Circuit name
- Country
- City
- Circuit length
- Number of turns
- Number of race laps
- Race distance
- Circuit history
- Famous corners
- Circuit description
- Fastest race lap
- Record holder
- Record year

The project intentionally does **not** use circuit photographs or circuit-layout graphics.

Circuit profiles instead use an original typography-based visual presentation that matches the overall interface.

---

# 🗄️ F1 Archive

The F1 Archive provides historical Formula Racing information.

The archive includes:

- Historical drivers
- Historical teams / constructors
- Historical circuits

## Historical Drivers

Available information can include:

- Full name
- Nationality
- Date of birth
- F1 debut / first recorded season
- Driver abbreviation
- Permanent number
- Grand Prix participation
- Wins
- Podiums
- Fastest laps
- Career points
- Historical summary

## Historical Teams / Constructors

Available information can include:

- Constructor name
- Nationality
- First recorded season
- Grand Prix participation
- Race wins
- Historical information

## Historical Circuits

Available information can include:

- Circuit name
- Country
- City
- Geographic coordinates
- First recorded F1 season
- Last recorded F1 season
- Number of recorded Grand Prix events
- Historical description

Historical archive information is stored in the SQLite database and can be enriched through the archive data process.

---

# 🏆 World Championships

The Championship section organizes championship information chronologically.

Users can explore:

- World Drivers' Championship
- Constructors' Championship
- Championship year
- Champion
- Champion information
- Historical context

Championship years are displayed chronologically.

Selecting a championship year opens an interactive information panel containing information about the selected champion.

---

# 📜 F1 History

The history section provides an interactive timeline covering important developments in Formula Racing.

Historical entries can include:

- Important years
- Sporting changes
- Technical developments
- Regulation changes
- Major historical events
- Beginner-friendly explanations

Selecting a historical year opens additional information in an interactive panel.

---

# 🛞 Strategy & Tyres

The Strategy & Tyres section provides beginner-friendly explanations of racing tyre strategy.

## Tyre Types

The application separates the major tyre types:

### 🔴 Soft

Designed for high grip and performance and generally used when maximum pace is required.

### 🟡 Medium

Provides a balance between performance and durability.

### ⚪ Hard

Designed to provide longer-lasting performance with lower degradation.

### 🟢 Intermediate

Used in changing or lightly wet conditions.

### 🔵 Full Wet

Designed for heavily wet conditions.

---

## Tyre Compounds

The application also separates the compound system:

- C1
- C2
- C3
- C4
- C5

Each compound is explained individually.

Information can include:

- Compound characteristics
- Relative hardness
- Grip
- Typical usage
- Strategy considerations
- Illustrative tyre-life estimates
- Beginner explanations

> Tyre-life figures shown in the application are illustrative estimates rather than guaranteed tyre lifetimes. Actual degradation depends on circuit characteristics, temperature, setup, driving style, traffic and race conditions.

---

# 📖 Formula Racing Glossary

The Glossary provides beginner-friendly explanations of Formula Racing terminology.

Examples include:

- Active Aerodynamics
- Airbox
- Apex
- Downforce
- Dirty Air
- Formation Lap
- Parc Fermé
- Pole Position
- Racing Line
- Safety Car
- Slipstream
- Stint
- Undercut
- Overcut
- Sector
- Virtual Safety Car
- And many more

Selecting a glossary term opens a detailed explanation.

Explanations are designed to include:

- Definition
- How it works
- Where it is used
- Beginner example
- Why it matters
- Additional context

---

# 🚦 Flags

The application includes interactive explanations for common racing flags.

Examples include:

- 🟢 Green Flag
- 🟡 Yellow Flag
- 🔴 Red Flag
- 🔵 Blue Flag
- ⚫ Black Flag
- 🏁 Chequered Flag

Each flag can be opened to view additional information covering:

- What the flag means
- What drivers should do
- When it is used
- Why it matters
- Example situations

---

# ⏱️ Racing Sessions

The application explains different race-weekend sessions, including:

- Free Practice
- Qualifying
- Q1
- Q2
- Q3
- Sprint
- Race

Each session can be selected to display additional beginner-friendly information.

---

# 📘 Racing Rules

The Rules section provides simplified explanations of important racing concepts and regulations.

The purpose is to make technical and sporting concepts easier to understand for users who are new to Formula Racing.

---

# 🔐 Admin System

The project includes an administrative interface for managing application data.

Admin functionality includes:

- Secure login
- Protected admin routes
- Database management
- Data editing
- Synchronization controls
- Admin logout

## Security Features

The backend includes:

- Server-side password hashing
- Protected administrative endpoints
- Session-based authentication
- Login rate limiting
- Security headers
- Environment-based credentials
- Configurable frontend origin
- No production password hard-coded in source code

### Environment Variables

Create a local `.env` file:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-strong-password
APP_ORIGIN=http://localhost:5173