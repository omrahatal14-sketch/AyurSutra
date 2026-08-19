// Firebase Firestore Database Initialization & Seeding Script for AyurSutra
// Run with: node init-firebase.js

const bcrypt = require('bcryptjs');
const firestore = require('./server/firestore');
const { DEFAULT_ADMIN } = require('./server/utils/bootstrap');

async function initializeFirebaseDatabase() {
  console.log('==============================================================');
  console.log('🔥 Initializing AyurSutra Database in Firebase Cloud Firestore');
  console.log('==============================================================\n');

  try {
    // 1. Test connection
    const connected = await firestore.testFirestoreConnection();
    if (!connected) {
      console.error('\n❌ Could not connect to Firebase Firestore.');
      console.error('👉 Please make sure:');
      console.error('   1. You have created a project in Firebase Console (https://console.firebase.google.com).');
      console.error('   2. You have enabled Cloud Firestore in test or production mode.');
      console.error('   3. You have downloaded "serviceAccountKey.json" and placed it in the project root.');
      console.error('   See FIREBASE_SETUP_GUIDE.md for detailed steps.\n');
      process.exit(1);
    }

    console.log('✅ Connection to Cloud Firestore verified!\n');

    // 2. Ensure Admin User
    console.log('👤 [1/4] Ensuring default admin account exists...');
    const existingAdmin = await firestore.findOneDoc('users', 'email', DEFAULT_ADMIN.email);
    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);

    if (!existingAdmin) {
      await firestore.createDoc('users', {
        name: DEFAULT_ADMIN.name,
        email: DEFAULT_ADMIN.email,
        password: hashedPassword,
        role: DEFAULT_ADMIN.role,
        approved: true,
        blocked: false,
        flagged: false,
        rating: 5.0,
        total_ratings: 1,
        complaints: 0,
        total_requests: 0,
        rejected_requests: 0,
        rejection_rate: 0,
        total_sessions: 0
      });
      console.log(`   ✨ Created Admin: ${DEFAULT_ADMIN.email} (Password: ${DEFAULT_ADMIN.password})`);
    } else {
      await firestore.updateDocById('users', existingAdmin.id, {
        name: DEFAULT_ADMIN.name,
        password: hashedPassword,
        role: DEFAULT_ADMIN.role,
        approved: true,
        blocked: false,
        flagged: false
      });
      console.log(`   ✨ Verified Admin: ${DEFAULT_ADMIN.email}`);
    }

    // 3. Seed Sample Doctor if none exists
    console.log('🩺 [2/4] Checking sample doctor...');
    const sampleDoctorEmail = 'doctor@ayursutra.com';
    const existingDoctor = await firestore.findOneDoc('users', 'email', sampleDoctorEmail);
    if (!existingDoctor) {
      const docPassword = await bcrypt.hash('doctor123', 10);
      await firestore.createDoc('users', {
        name: 'Dr. Aarav Sharma',
        email: sampleDoctorEmail,
        password: docPassword,
        role: 'doctor',
        license_number: 'AYU-10492-MH',
        approved: true,
        blocked: false,
        flagged: false,
        rating: 4.85,
        total_ratings: 14,
        complaints: 0,
        total_requests: 18,
        rejected_requests: 1,
        rejection_rate: 5.5,
        total_sessions: 24
      });
      console.log(`   ✨ Created Doctor: ${sampleDoctorEmail} (Password: doctor123)`);
    } else {
      console.log(`   ✨ Doctor already exists: ${sampleDoctorEmail}`);
    }

    // 4. Seed Sample Patients if collection is empty
    console.log('🧑‍🤝‍🧑 [3/4] Checking sample patients...');
    const patients = await firestore.listDocs('patients', { limit: 1 });
    if (patients.length === 0) {
      await firestore.createDoc('patients', {
        name: 'Rahul Varma',
        email: 'rahul.varma@example.com',
        phone: '+91 9876543210',
        age: 38,
        therapy: 'Vamana (Emesis Therapy)',
        status: 'active',
        join_date: '2026-08-01',
        last_visit: '2026-08-18'
      });
      await firestore.createDoc('patients', {
        name: 'Pooja Patil',
        email: 'pooja.patil@example.com',
        phone: '+91 9822012345',
        age: 29,
        therapy: 'Basti (Enema Therapy)',
        status: 'active',
        join_date: '2026-08-05',
        last_visit: '2026-08-19'
      });
      console.log('   ✨ Seeded initial sample patients');
    } else {
      console.log(`   ✨ Patients collection already has records.`);
    }

    // 5. Seed Welcome Notification
    console.log('🔔 [4/5] Ensuring welcome notifications...');
    const notifications = await firestore.listDocs('notifications', { limit: 1 });
    if (notifications.length === 0) {
      await firestore.createDoc('notifications', {
        to_email: 'All Patients',
        toEmail: 'All Patients',
        message: 'Welcome to AyurSutra! Your Panchakarma health management platform is now live on Firebase Cloud Firestore.'
      });
      console.log('   ✨ Seeded welcome notification.');
    } else {
      console.log('   ✨ Notifications already present.');
    }

    // 6. Seed MCIM Verified Doctor cache for Dr. Aarav Sharma
    console.log('📜 [5/5] Ensuring MCIM verified doctor cache...');
    const existingVerified = await firestore.findOneDoc('verified_doctors', 'registration_number', 'AYU-10492-MH');
    if (!existingVerified) {
      await firestore.createDoc('verified_doctors', {
        registration_number: 'AYU-10492-MH',
        full_name: 'Dr. Aarav Sharma',
        qualification: 'B.A.M.S., M.D. (Panchakarma) - Maharashtra Council',
        status: 'Registered & Active'
      });
      console.log('   ✨ Seeded MCIM verification record for AYU-10492-MH.');
    } else {
      console.log('   ✨ MCIM verification record already present.');
    }

    console.log('\n==============================================================');
    console.log('🎉 Firebase Database Initialized Successfully!');
    console.log('==============================================================');
    console.log('Credentials to log in:');
    console.log('  Admin:   omrahatal@gmail.com  /  omrahatal');
    console.log('  Doctor:  doctor@ayursutra.com /  doctor123');
    console.log('==============================================================\n');

  } catch (err) {
    console.error('\n❌ Initialization error:', err.message);
  } finally {
    process.exit(0);
  }
}

initializeFirebaseDatabase();
