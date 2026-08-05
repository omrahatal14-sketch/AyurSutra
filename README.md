# AyurSutra Management System

AyurSutra is a comprehensive full-stack Panchakarma Patient Management System designed for Ayurvedic clinics. It facilitates complete clinic operations, from patient registration and session tracking to doctor verification and inventory requests.

## Architecture

AyurSutra utilizes a hybrid architecture:
*   **Frontend**: Built with pure HTML, CSS, and vanilla JavaScript. Features a premium, SaaS-style glassmorphism UI. Authentication and some legacy data operations utilize Firebase SDKs.
*   **Backend Server**: A Node.js and Express.js server that serves the static frontend files and mounts robust REST APIs.
*   **Database**: A relational MySQL 8.0 database handling structured core data (Users, Patients, Sessions, Notifications).
*   **Automation Engine**: An isolated Playwright scraping utility used for intelligent doctor license verification against public government portals (MCIM).

## Core Features

### 1. Multi-Role Dashboards
*   **Admin Dashboard**: Centralized control center to verify new doctor registrations, manage active users, broadcast notifications, and view overarching clinic analytics.
*   **Doctor Dashboard**: A specialized workspace for doctors to add new patients, track ongoing treatments (Vamana, Basti, etc.), log daily progress notes, and submit medicine/inventory requests.
*   **Patient Dashboard**: A personalized view for patients to track their treatment sessions, submit feedback, and view notifications from their doctors.

### 2. Automated Doctor Verification (MCIM)
To combat fraudulent registrations, AyurSutra includes a dedicated verification module:
*   **Cache-First Approach**: The `/api/verify-doctor` endpoint first queries the local MySQL `verified_doctors` table to see if the doctor's Registration Number has been checked before.
*   **Headless Scraping**: On a cache miss, the backend utilizes Playwright to invisibly navigate to the Maharashtra Council of Indian Medicine (MCIM) public portal.
*   **Auto-Resolution**: The scraper automatically handles ASP.NET GridView table extraction and solves mathematical CAPTCHAs to return real-time licensing data.
*   **UI Integration**: Admins get instant visual warnings if the name a doctor registered with does not match the official government record.

### 3. Comprehensive Treatment Tracking
*   Doctors can log sessions targeting specific treatments (e.g., Virechana, Nasya).
*   Progress notes can be appended to active sessions to track patient reactions and improvements over time.

## Prerequisites

*   **Node.js**: v18.x or higher
*   **MySQL Server**: v8.0 running locally or remotely
*   **Firebase Project**: Web credentials for Frontend Auth

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Initialization**
   *   Ensure MySQL is running.
   *   Initialize the database schema (this creates the `ayursutra_db` and all tables):
   ```bash
   npm run db:init
   ```

3. **Environment Configuration**
   *   Create a `.env` file in the root directory.
   *   Add your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=ayursutra_db
   PORT=3000
   ```

4. **Start the Application**
   ```bash
   npm start
   ```
   *For development with auto-reloading:* `npm run dev`

5. **Accessing the System**
   *   Open your browser and navigate to `http://localhost:3000`
   *   The system will automatically serve `login.html`.

## Project Structure

*   `server.js`: Main Express application entry point.
*   `server/db.js`: MySQL connection pool configuration.
*   `server/schema.sql`: Database schema definition for MySQL.
*   `server/routes/`: Express routers for handling API endpoints (`users`, `patients`, `verifyDoctor`, etc.).
*   `server/utils/mcimScraper.js`: The isolated Playwright script for government portal scraping.
*   `js/`: Frontend JavaScript logic handling UI rendering, Firebase auth, and API fetch calls.
*   `css/`: Frontend styling, including the centralized `style.css` design system.
*   `*.html`: Frontend views (Admin, Doctor, Patient, Login).
