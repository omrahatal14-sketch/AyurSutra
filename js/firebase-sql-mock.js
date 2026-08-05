// SQL Mock for Firebase Firestore API
// This intercepts Firebase calls and routes them to our Express + MySQL Backend

// Simple key mapper to bridge frontend camelCase with MySQL snake_case
function mapToBackend(data) {
  if (!data || typeof data !== 'object') return data;
  const map = {
    'patientEmail': 'patient_email',
    'doctorEmail': 'doctor_email',
    'doctorId': 'doctor_id',
    'toEmail': 'to_email',
    'join': 'join_date',
    'lastVisit': 'last_visit',
    'timestamp': 'created_at',
    'licenseNumber': 'license_number',
    'degreeUrl': 'degree_url',
    'idProofUrl': 'id_proof_url',
    'totalRatings': 'total_ratings',
    'totalRequests': 'total_requests',
    'rejectedRequests': 'rejected_requests',
    'rejectionRate': 'rejection_rate',
    'totalSessions': 'total_sessions'
  };
  const result = {};
  for (let key in data) {
    const mappedKey = map[key] || key;
    result[mappedKey] = data[key];
  }
  return result;
}

function mapToFrontend(data) {
  if (!data || typeof data !== 'object') return data;
  const map = {
    'patient_email': 'patientEmail',
    'doctor_email': 'doctorEmail',
    'doctor_id': 'doctorId',
    'to_email': 'toEmail',
    'join_date': 'join',
    'last_visit': 'lastVisit',
    'created_at': 'timestamp',
    'license_number': 'licenseNumber',
    'degree_url': 'degreeUrl',
    'id_proof_url': 'idProofUrl',
    'total_ratings': 'totalRatings',
    'total_requests': 'totalRequests',
    'rejected_requests': 'rejectedRequests',
    'rejection_rate': 'rejectionRate',
    'total_sessions': 'totalSessions'
  };
  const booleanFields = ['approved', 'blocked', 'flagged', 'reported'];
  const result = {};
  for (let key in data) {
    const mappedKey = map[key] || key;
    let val = data[key];
    if (booleanFields.includes(key) || booleanFields.includes(mappedKey)) {
      if (val === 1 || val === '1' || val === true || val === 'true') val = true;
      else val = false;
    }
    result[mappedKey] = val;
  }
  return result;
}

export function collection(db, collectionName) {
  return collectionName;
}

export function doc(db, collectionName, id) {
  return { collectionName, id };
}

export async function addDoc(collectionName, data) {
  const res = await fetch(`/api/${collectionName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapToBackend(data))
  });
  if (!res.ok) throw new Error("Failed to add document to " + collectionName);
  const result = await res.json();
  return { id: result.id };
}

export async function getDoc(docRef) {
  const res = await fetch(`/api/${docRef.collectionName}/${docRef.id}`);
  if (!res.ok) {
    return { exists: () => false, data: () => null, id: docRef.id };
  }
  let data = await res.json();
  data = mapToFrontend(data);
  return {
    exists: () => !!data,
    data: () => data,
    id: docRef.id
  };
}

export async function getDocs(collectionOrQuery) {
  let endpoint = '';

  if (typeof collectionOrQuery === 'string') {
    endpoint = `/api/${collectionOrQuery}`;
  } else {
    endpoint = `/api/${collectionOrQuery.collectionName}`;
  }

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error("Failed to fetch documents from " + endpoint);
  
  let data = await res.json();

  if (typeof collectionOrQuery === 'object' && collectionOrQuery.field) {
    // Re-map field name for filtering
    const backendField = mapToBackend({ [collectionOrQuery.field]: 1 });
    const targetKey = Object.keys(backendField)[0];

    data = data.filter(item => {
      if (collectionOrQuery.op === '==') {
        return item[targetKey] == collectionOrQuery.value;
      }
      return true;
    });
  }

  // Map to Firebase snapshot structure with mapped frontend keys
  const docs = data.map(item => {
    const frontendItem = mapToFrontend(item);
    return {
      id: frontendItem.id || frontendItem.uid, 
      data: () => frontendItem
    };
  });

  return {
    docs,
    forEach: (cb) => docs.forEach(cb)
  };
}

export async function updateDoc(docRef, data) {
  const res = await fetch(`/api/${docRef.collectionName}/${docRef.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapToBackend(data))
  });
  if (!res.ok) throw new Error("Failed to update document");
}

export async function deleteDoc(docRef) {
  const res = await fetch(`/api/${docRef.collectionName}/${docRef.id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error("Failed to delete document");
}

export function query(collectionName, ...conditions) {
  const cond = conditions[0] || {};
  return {
    collectionName,
    field: cond.field,
    op: cond.op,
    value: cond.value
  };
}

export function where(field, op, value) {
  return { field, op, value };
}
