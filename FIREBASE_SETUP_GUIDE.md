# 🌿 AyurSutra - Firebase Setup & Integration Guide

This guide will walk you through setting up **Firebase Cloud Firestore** for AyurSutra step-by-step.

---

## 📋 Table of Contents
1. [Step 1: Create or Open a Firebase Project](#step-1-create-or-open-a-firebase-project)
2. [Step 2: Enable Cloud Firestore Database](#step-2-enable-cloud-firestore-database)
3. [Step 3: Generate and Download `serviceAccountKey.json`](#step-3-generate-and-download-serviceaccountkeyjson)
4. [Step 4: Configure Cloud Firestore Security Rules](#step-4-configure-cloud-firestore-security-rules)
5. [Step 5: Place the Service Account Key in Your Project](#step-5-place-the-service-account-key-in-your-project)
6. [Step 6: Initialize & Test the Database](#step-6-initialize--test-the-database)
7. [Step 7: Run AyurSutra](#step-7-run-ayursutra)

---

## Step 1: Create or Open a Firebase Project

1. Go to the **[Firebase Console](https://console.firebase.google.com/)** and sign in with your Google account.
2. Click **"Add project"** (or select your existing project e.g. `ayursutra-76f6c`).
3. Enter your project name (e.g. `AyurSutra`) and click **Continue**.
4. (Optional) Disable Google Analytics for now or leave it enabled, then click **Create project**.
5. Wait for the project setup to finish, then click **Continue**.

---

## Step 2: Enable Cloud Firestore Database

1. In the left-hand sidebar menu, click on **Build** ➔ **Firestore Database**.
2. Click the **"Create database"** button.
3. **Database location**: Select a location closest to you (e.g., `asia-south1 (Mumbai)` or `us-central`).
4. **Security rules**:
   - Select **Start in test mode** (this allows read/write access during development for 30 days).
5. Click **Next** ➔ **Enable**.
6. Cloud Firestore is now active!

---

## Step 3: Generate and Download `serviceAccountKey.json`

The backend uses Firebase Admin SDK to securely communicate with Cloud Firestore without exposing database secrets to the browser.

1. In the Firebase Console, click the **Gear icon (⚙️ Project Settings)** at the top left of the sidebar.
2. Click on the **Service accounts** tab.
3. Ensure **Firebase Admin SDK** is selected.
4. Click the blue button **"Generate new private key"**.
5. A confirmation dialog will appear — click **"Generate key"**.
6. A JSON file will be downloaded to your computer (named something like `ayursutra-76f6c-firebase-adminsdk-xxxxx.json`).

---

## Step 4: Configure Cloud Firestore Security Rules

To ensure seamless operation, check your Firestore Rules:

1. In the Firebase Console, go to **Firestore Database** ➔ **Rules** tab.
2. Replace the rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all collections
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **Publish**.

> [!NOTE]
> Since the backend server performs operations using the Firebase Admin SDK, it has full administrative access regardless of rules. Setting client rules to allow read/write is helpful if any frontend components make direct client queries.

---

## Step 5: Place the Service Account Key in Your Project

1. Find the downloaded JSON file in your `Downloads` folder.
2. Rename the downloaded file to:
   ```text
   serviceAccountKey.json
   ```
3. Move or copy this `serviceAccountKey.json` file into your AyurSutra root folder:
   ```text
   c:\Users\Dell\OneDrive\Desktop\AyurSutra\serviceAccountKey.json
   ```

*(Note: `serviceAccountKey.json` is already listed in `.gitignore` so your secret credentials won't be pushed to public Git repositories).*

---

## Step 6: Initialize & Test the Database

Once `serviceAccountKey.json` is in your project folder, run the automated initialization script:

```bash
npm run db:init-firebase
```

This script will:
- ✅ Verify connection to Cloud Firestore.
- 👤 Create or verify the default Admin account (`omrahatal@gmail.com` / `omrahatal`).
- 🩺 Seed a sample Doctor account (`doctor@ayursutra.com` / `doctor123`).
- 🧑‍🤝‍🧑 Seed sample patient data and welcome notification.

---

## Step 7: Run AyurSutra

Start the AyurSutra server:

```bash
npm start
```
Or for auto-reload during development:
```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`** (or `http://localhost:3000/login.html`)

### Default Logins:
- **Admin**: `omrahatal@gmail.com` | Password: `omrahatal`
- **Doctor**: `doctor@ayursutra.com` | Password: `doctor123`
- **Patient**: You can sign up a new patient directly at `/signup.html`

---

## 🗄️ Firestore Collections Overview

AyurSutra automatically organizes data into the following Cloud Firestore collections:

| Collection | Description | Key Fields |
|---|---|---|
| `users` | Admin, Doctors, and Patients | `email`, `role`, `password`, `approved`, `blocked`, `rating` |
| `patients` | Patient clinical profiles | `name`, `email`, `phone`, `therapy`, `status`, `last_visit` |
| `sessions` | Scheduled Panchakarma therapies | `patient_email`, `doctor_email`, `type`, `date`, `time`, `payment_status` |
| `requests` | Therapy booking requests | `patient_email`, `doctor_email`, `therapy`, `date`, `status` |
| `feedbacks` | Patient health feedback | `patient_email`, `pain`, `energy`, `satisfaction`, `notes` |
| `notifications` | System & appointment alerts | `to_email`, `message`, `created_at` |
| `progress_notes` | Doctor clinical observations | `doctor_email`, `notes`, `created_at` |
| `verified_doctors` | MCIM government license cache | `registration_number`, `full_name`, `qualification`, `status` |

---

## 💡 Troubleshooting

- **Error: "Could not load the default credentials"**: Make sure you have placed `serviceAccountKey.json` in the root folder, or check that `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` points to your file.
- **Want to switch back to MySQL?**: In `.env`, change `DB_TYPE=firebase` to `DB_TYPE=mysql`.
