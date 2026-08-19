// Firebase Admin SDK & Firestore Database Adapter for AyurSutra
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

let firestoreInstance = null;
let firebaseApp = null;
let isInitialized = false;
let hasValidCredentials = false;

/**
 * Initialize Firebase Admin SDK
 */
function initFirebase() {
  if (isInitialized && firestoreInstance) {
    return firestoreInstance;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0];
    firestoreInstance = getFirestore(firebaseApp);
    isInitialized = true;
    return firestoreInstance;
  }

  const customKeyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const rootKeyPath = path.join(__dirname, '..', 'serviceAccountKey.json');
  const serverKeyPath = path.join(__dirname, 'serviceAccountKey.json');

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : process.env.FIREBASE_SERVICE_ACCOUNT;
      console.log('🔑 Loading Firebase credentials from FIREBASE_SERVICE_ACCOUNT environment variable');
    } catch (e) {
      console.warn('⚠️ Could not parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
    }
  } else if (customKeyPath && fs.existsSync(customKeyPath)) {
    try {
      serviceAccount = require(path.resolve(customKeyPath));
      console.log(`🔑 Loading Firebase credentials from: ${customKeyPath}`);
    } catch (e) {
      console.warn('⚠️ Could not parse credentials from custom path:', e.message);
    }
  } else if (fs.existsSync(rootKeyPath)) {
    try {
      serviceAccount = require(rootKeyPath);
      console.log('🔑 Loading Firebase credentials from: ./serviceAccountKey.json');
    } catch (e) {
      console.warn('⚠️ Could not parse ./serviceAccountKey.json:', e.message);
    }
  } else if (fs.existsSync(path.join(__dirname, '..', 'serviceAccountKey.json.json'))) {
    try {
      serviceAccount = require(path.join(__dirname, '..', 'serviceAccountKey.json.json'));
      console.log('🔑 Loading Firebase credentials from: ./serviceAccountKey.json.json');
    } catch (e) {
      console.warn('⚠️ Could not parse ./serviceAccountKey.json.json:', e.message);
    }
  } else if (fs.existsSync(serverKeyPath)) {
    try {
      serviceAccount = require(serverKeyPath);
      console.log('🔑 Loading Firebase credentials from: ./server/serviceAccountKey.json');
    } catch (e) {
      console.warn('⚠️ Could not parse ./server/serviceAccountKey.json:', e.message);
    }
  }

  if (serviceAccount) {
    hasValidCredentials = true;
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || 'ayursutra-76f6c'
    });
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    hasValidCredentials = true;
    firebaseApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'ayursutra-76f6c',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
      projectId: process.env.FIREBASE_PROJECT_ID || 'ayursutra-76f6c'
    });
    console.log('🔑 Initialized Firebase with environment variables');
  } else {
    // Fallback initialization with project ID (useful for development or Google Cloud environment)
    const projectId = process.env.FIREBASE_PROJECT_ID || 'ayursutra-76f6c';
    console.warn('⚠️ No serviceAccountKey.json found in project folder.');
    console.warn('   To enable Cloud Firestore, place "serviceAccountKey.json" in project root.');
    console.warn('   👉 See FIREBASE_SETUP_GUIDE.md for 3-minute setup instructions.\n');
    hasValidCredentials = false;
    firebaseApp = initializeApp({
      projectId: projectId
    });
  }

  firestoreInstance = getFirestore(firebaseApp);
  
  // Configure Firestore settings to ignore undefined properties
  try {
    firestoreInstance.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // Settings already locked or initialized
  }

  isInitialized = true;
  return firestoreInstance;
}

// Get or initialize Firestore
const db = initFirebase();

/**
 * Test Firebase Firestore connection
 */
async function testFirestoreConnection() {
  if (!hasValidCredentials) {
    console.log('ℹ️ Firebase Mode: Ready for credentials.');
    console.log('   Place "serviceAccountKey.json" in root folder to connect live to Firebase.');
    return false;
  }

  try {
    const healthRef = db.collection('_health').doc('connection_check');
    await healthRef.set({
      status: 'connected',
      timestamp: new Date().toISOString()
    }, { merge: true });

    const projectId = firebaseApp?.options?.projectId || process.env.FIREBASE_PROJECT_ID || 'ayursutra';
    console.log(`🔥 Firebase Cloud Firestore connected successfully! [Project: ${projectId}]`);
    return true;
  } catch (err) {
    console.error('❌ Firebase connection error:', err.message);
    console.error('   Please ensure serviceAccountKey.json is valid, or check FIREBASE_SETUP_GUIDE.md.');
    return false;
  }
}

/**
 * Standardize doc serialization for JSON response
 */
function serializeDoc(docSnapshot) {
  if (!docSnapshot || !docSnapshot.exists) return null;
  const data = docSnapshot.data();
  const id = docSnapshot.id;

  // Convert Firestore Timestamps to ISO strings if needed
  const formatted = { id, ...data };
  for (const key of Object.keys(formatted)) {
    if (formatted[key] && typeof formatted[key].toDate === 'function') {
      formatted[key] = formatted[key].toDate().toISOString();
    }
  }
  return formatted;
}

/**
 * Helper: List all documents in a collection
 */
async function listDocs(collectionName, options = {}) {
  let query = db.collection(collectionName);

  if (options.orderBy) {
    const direction = options.orderDirection || 'desc';
    query = query.orderBy(options.orderBy, direction);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const snapshot = await query.get();
  const docs = [];
  snapshot.forEach(doc => {
    docs.push(serializeDoc(doc));
  });
  return docs;
}

/**
 * Helper: Get a single document by ID
 */
async function getDocById(collectionName, id) {
  if (!id) return null;
  const docRef = db.collection(collectionName).doc(String(id));
  const doc = await docRef.get();
  return serializeDoc(doc);
}

/**
 * Helper: Find documents matching a field == value
 */
async function findDocs(collectionName, field, value, orderByField = null, orderDirection = 'desc') {
  let query = db.collection(collectionName).where(field, '==', value);
  if (orderByField) {
    query = query.orderBy(orderByField, orderDirection);
  }
  const snapshot = await query.get();
  const docs = [];
  snapshot.forEach(doc => {
    docs.push(serializeDoc(doc));
  });
  return docs;
}

/**
 * Helper: Find first document matching a field == value
 */
async function findOneDoc(collectionName, field, value) {
  const query = db.collection(collectionName).where(field, '==', value).limit(1);
  const snapshot = await query.get();
  if (snapshot.empty) return null;
  return serializeDoc(snapshot.docs[0]);
}

/**
 * Helper: Create a new document in a collection
 */
async function createDoc(collectionName, data, customId = null) {
  const timestamp = new Date().toISOString();
  const payload = {
    ...data,
    created_at: data.created_at || timestamp,
    updated_at: timestamp
  };

  let docRef;
  if (customId) {
    docRef = db.collection(collectionName).doc(String(customId));
    await docRef.set(payload);
  } else {
    docRef = await db.collection(collectionName).add(payload);
  }

  return { id: docRef.id, ...payload };
}

/**
 * Helper: Update an existing document by ID
 */
async function updateDocById(collectionName, id, data) {
  if (!id) throw new Error('Document ID is required for update');
  const docRef = db.collection(collectionName).doc(String(id));
  const payload = {
    ...data,
    updated_at: new Date().toISOString()
  };
  await docRef.set(payload, { merge: true });
  return { id, ...payload };
}

/**
 * Helper: Delete a document by ID
 */
async function deleteDocById(collectionName, id) {
  if (!id) throw new Error('Document ID is required for deletion');
  const docRef = db.collection(collectionName).doc(String(id));
  await docRef.delete();
  return { success: true, id };
}

module.exports = {
  db,
  hasValidCredentials: () => hasValidCredentials,
  initFirebase,
  testFirestoreConnection,
  serializeDoc,
  listDocs,
  getDocById,
  findDocs,
  findOneDoc,
  createDoc,
  updateDocById,
  deleteDocById
};
