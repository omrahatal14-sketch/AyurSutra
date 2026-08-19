# AyurSutra Management System

AyurSutra is a comprehensive full-stack Panchakarma Patient Management System designed for Ayurvedic clinics. It facilitates complete clinic operations, from patient registration and session tracking to doctor verification, payments, and AI-powered health assistance.

## Architecture

AyurSutra utilizes a modern full-stack architecture:
*   **Frontend**: Built with HTML, CSS, and vanilla JavaScript. Features a SaaS-style glassmorphism UI with responsive multi-role dashboards.
*   **Backend Server**: A Node.js and Express.js server that serves the frontend files and powers REST APIs.
*   **Database**: **Firebase Cloud Firestore** (default, fully cloud-hosted) with optional MySQL support.
*   **Automation Engine**: An isolated Playwright scraping utility for intelligent doctor license verification against public government portals (MCIM).

## Core Features

### 1. Multi-Role Dashboards
*   **Admin Dashboard**: Centralized control center to verify new doctor registrations, manage active users, broadcast notifications, and view clinic revenue analytics.
*   **Doctor Dashboard**: Specialized workspace for doctors to add new patients, track ongoing treatments (Vamana, Virechana, Basti, Nasya, Raktamokshana), log daily progress notes, and accept appointment requests.
*   **Patient Dashboard**: Personalized portal for patients to track treatment sessions, submit daily recovery feedback, pay session fees via Razorpay, and chat with the AI Health Assistant.

### 2. Automated Doctor Verification (MCIM)
*   **Cache-First Architecture**: Checks the Firestore cache before initiating web lookups.
*   **Headless Scraping**: On a cache miss, Playwright searches the Maharashtra Council of Indian Medicine (MCIM) public portal, solves mathematical CAPTCHAs, and caches verified credentials.

---

## Quick Setup Guide (Firebase)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Firebase Cloud Firestore
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** (in test mode).
3. Go to **Project Settings ➔ Service accounts**, click **Generate new private key**, and download the JSON file.
4. Rename the downloaded file to `serviceAccountKey.json` and place it in the project root folder.
> 👉 **For full visual instructions, see [FIREBASE_SETUP_GUIDE.md](FIREBASE_SETUP_GUIDE.md).**

### 3. Initialize the Database
```bash
npm run db:init-firebase
```

### 4. Start the Application
```bash
npm start
```
*For auto-reloading during development:* `npm run dev`

### 5. Access the System
* Open **`http://localhost:3000`**
* **Admin Login**: `omrahatal@gmail.com` | `omrahatal`
* **Doctor Login**: `doctor@ayursutra.com` | `doctor123`
