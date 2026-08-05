<div align="center">
  <h1>🌿 AyurSutra</h1>
  <p><b>A Comprehensive Panchakarma Patient Management System for Modern Ayurvedic Clinics</b></p>

  <!-- Badges -->
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img alt="Express.js" src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img alt="MySQL" src="https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" />
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" />
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E" />
</div>

<br />

AyurSutra is a full-stack web application designed to streamline clinic operations for Ayurvedic practitioners. It handles everything from patient registration and specialized session tracking (like Vamana, Basti) to automated doctor license verification, all wrapped in a modern, biophilic glassmorphism design.

## ✨ Key Features

### 👥 Multi-Role Dashboards
*   🛡️ **Admin Dashboard**: Centralized control center to verify new doctor registrations, manage active users, broadcast notifications, and view clinic analytics.
*   👨‍⚕️ **Doctor Dashboard**: A specialized workspace for doctors to add new patients, track ongoing Panchakarma treatments, log daily progress notes, and submit medicine/inventory requests.
*   🤕 **Patient Dashboard**: A personalized portal for patients to track their treatment sessions, submit feedback, and view direct notifications from their doctors.

### 🤖 Automated Doctor Verification (MCIM)
To ensure clinic integrity and combat fraudulent registrations, AyurSutra includes an intelligent web-scraping module:
*   **Cache-First Architecture**: Quickly verifies if a doctor's Registration Number has been checked before via local MySQL records.
*   **Headless Playwright Scraping**: Automatically navigates the Maharashtra Council of Indian Medicine (MCIM) public portal in the background.
*   **Auto-CAPTCHA Resolution**: The scraper seamlessly extracts ASP.NET tables and solves mathematical CAPTCHAs to provide real-time licensing data.
*   **Smart UI Warnings**: Alerts admins instantly if a registered name mismatches official government records.

### 📋 Treatment & Session Tracking
*   Log individualized sessions targeting specific Ayurvedic treatments (Virechana, Nasya, etc.).
*   Append comprehensive progress notes to active sessions to monitor patient reactions and holistic improvements over time.

---

## 🏗️ Architecture

AyurSutra utilizes a robust hybrid architecture:
*   **Frontend**: Built with pure HTML, CSS, and Vanilla JavaScript, featuring a premium, "Organic Biophilic" glassmorphism UI. Integrates Firebase SDKs for smooth authentication.
*   **Backend Server**: A powerful Node.js and Express.js server that serves static frontend files while mounting secure RESTful APIs.
*   **Database**: Relational MySQL 8.0 database handling structured core data securely.
*   **Automation Engine**: An isolated Playwright scraping utility for external data validation.

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js**: `v18.x` or higher
*   **MySQL Server**: `v8.0` (running locally or remotely)
*   **Firebase Project**: Web credentials required for Frontend Auth

### Installation & Setup

1. **Clone the repository & Install Dependencies**
   ```bash
   git clone https://github.com/omrahatal14-sketch/AyurSutra.git
   cd AyurSutra
   npm install
   ```

2. **Database Initialization**
   * Ensure your MySQL server is running.
   * Initialize the database schema (creates `ayursutra_db` and all required tables):
   ```bash
   npm run db:init
   ```

3. **Environment Configuration**
   * Create a `.env` file in the root directory.
   * Add your MySQL credentials and desired port:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=ayursutra_db
   PORT=3000
   ```

4. **Start the Application**
   ```bash
   npm start
   ```
   *(For development with auto-reloading: `npm run dev`)*

5. **Access the System**
   * Open your browser and navigate to `http://localhost:3000`

---

## 📂 Project Structure

```text
AyurSutra/
├── server.js                 # Main Express application entry point
├── server/
│   ├── db.js                 # MySQL connection pool configuration
│   ├── schema.sql            # Database schema definitions
│   ├── routes/               # Express API endpoints
│   └── utils/mcimScraper.js  # Playwright script for portal scraping
├── js/                       # Frontend JS (UI rendering, API calls, Auth)
├── css/                      # Centralized design system (style.css)
└── *.html                    # Frontend Views (Admin, Doctor, Patient, Login)
```
