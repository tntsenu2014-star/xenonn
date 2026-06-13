// Firestore Compatibility Adapter for Secure Full-Stack SQL Proxying

export type QueryConstraint = any;

export class SimulatedDoc {
  id: string;
  private _data: any;

  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
  }

  exists() {
    return this._data !== null && this._data !== undefined;
  }

  data() {
    return this._data;
  }
}

export class SimulatedQuerySnapshot {
  docs: SimulatedDoc[];

  constructor(docs: SimulatedDoc[]) {
    this.docs = docs;
  }

  get empty() {
    return this.docs.length === 0;
  }
}

// Stubs for Firebase configuration
export function getFirestore(app?: any, databaseId?: string) {
  return { type: 'firestore', app, databaseId };
}

export function collection(db: any, path: string) {
  return { type: 'collection', path };
}

export function doc(db: any, path: string, ...idSegments: string[]) {
  const cleanId = idSegments.join('/');
  return { type: 'doc', path, id: cleanId };
}

export function query(collectionRef: any, ...constraints: any[]) {
  return { 
    type: 'query', 
    path: collectionRef.path, 
    constraints 
  };
}

export function where(field: string, op: string, val: any) {
  return { type: 'where', field, op, val };
}

export function orderBy(field: string, direction = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(num: number) {
  return { type: 'limit', num };
}

export function or(...filters: any[]) {
  return { type: 'or', filters };
}

export function serverTimestamp() {
  return Date.now();
}

export const Timestamp = {
  now() {
    return {
      toDate: () => new Date(),
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0
    };
  }
};

// Map query-like objects to basic HTTP query strings safely
function buildQueryString(constraints: any[]): string {
  const params = new URLSearchParams();
  for (const c of constraints || []) {
    if (c && c.type === 'where' && c.op === '==') {
      params.append(c.field, String(c.val));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

// REST Backend Proxies
export async function getDocs(q: any): Promise<SimulatedQuerySnapshot> {
  const collectionPath = q.path || q.collection?.path || '';
  const queryString = q.constraints ? buildQueryString(q.constraints) : '';
  
  try {
    const res = await fetch(`/api/db/${collectionPath}${queryString}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    
    let list = Array.isArray(data) ? data : [];
    
    // Check if client-side orderBy constraint is applied
    const orderRef = q.constraints?.find((c: any) => c.type === 'orderBy');
    if (orderRef) {
      const field = orderRef.field;
      const desc = orderRef.direction === 'desc';
      list = [...list].sort((a: any, b: any) => {
        const valA = a[field] ?? 0;
        const valB = b[field] ?? 0;
        return desc ? (valB - valA) : (valA - valB);
      });
    }

    // Check if client-side limit constraint is applied
    const limitRef = q.constraints?.find((c: any) => c.type === 'limit');
    if (limitRef) {
      list = list.slice(0, limitRef.num);
    }

    const docs = list.map((item: any) => new SimulatedDoc(item.id || '', item));
    return new SimulatedQuerySnapshot(docs);
  } catch (err) {
    console.error(`Mock getDocs error on ${collectionPath}:`, err);
    return new SimulatedQuerySnapshot([]);
  }
}

export async function getDoc(docRef: any): Promise<SimulatedDoc> {
  try {
    const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`);
    if (res.status === 404) {
      return new SimulatedDoc(docRef.id, null);
    }
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return new SimulatedDoc(docRef.id || data.id, data);
  } catch (err) {
    console.error(`Mock getDoc error on ${docRef.path}/${docRef.id}:`, err);
    return new SimulatedDoc(docRef.id, null);
  }
}

export async function getDocFromServer(docRef: any): Promise<SimulatedDoc> {
  return getDoc(docRef);
}

export async function addDoc(collectionRef: any, data: any): Promise<{ id: string }> {
  try {
    const res = await fetch(`/api/db/${collectionRef.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, createdAt: Date.now() })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const result = await res.json();
    return { id: result.id };
  } catch (err) {
    console.error(`Mock addDoc error on ${collectionRef.path}:`, err);
    throw err;
  }
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }): Promise<void> {
  try {
    // Check if document already exists
    const checkRes = await fetch(`/api/db/${docRef.path}/${docRef.id}`);
    const exists = checkRes.status !== 404 && checkRes.ok;

    if (exists) {
      if (options?.merge) {
        // Fetch current, merge and update
        const current = await checkRes.json();
        const merged = { ...current, ...data, id: docRef.id };
        
        const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged)
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      } else {
        // Document exists, but merge is false -> complete overwrite (preserving the ID)
        const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, id: docRef.id })
        });
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      }
    } else {
      // Write new
      const res = await fetch(`/api/db/${docRef.path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: docRef.id })
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    }
  } catch (err) {
    console.error(`Mock setDoc error on ${docRef.path}/${docRef.id}:`, err);
    throw err;
  }
}

export async function updateDoc(docRef: any, data: any): Promise<void> {
  try {
    // PUT update endpoint
    const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  } catch (err) {
    console.error(`Mock updateDoc error on ${docRef.path}/${docRef.id}:`, err);
    throw err;
  }
}

export async function deleteDoc(docRef: any): Promise<void> {
  try {
    const res = await fetch(`/api/db/${docRef.path}/${docRef.id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
  } catch (err) {
    console.error(`Mock deleteDoc error on ${docRef.path}/${docRef.id}:`, err);
    throw err;
  }
}

// Periodic polling onSnapshot emulator to handle seamless "live" changes without WebSockets
export function onSnapshot(
  targetRef: any,
  onNext: (snapshot: any) => void,
  onError?: (error: any) => void
): () => void {
  
  let isStopped = false;
  let intervalId: any = null;
  let lastDataString = '';

  const runFetch = async () => {
    if (isStopped) return;
    try {
      if (targetRef.type === 'doc') {
        const snap = await getDoc(targetRef);
        if (isStopped) return;
        const currentStr = JSON.stringify(snap.data() || {});
        if (currentStr !== lastDataString) {
          lastDataString = currentStr;
          onNext(snap);
        }
      } else {
        // Query/Collection
        const snap = await getDocs(targetRef);
        if (isStopped) return;
        const currentStr = JSON.stringify(snap.docs.map(d => d.data()) || []);
        if (currentStr !== lastDataString) {
          lastDataString = currentStr;
          onNext(snap);
        }
      }
    } catch (err) {
      console.error("onSnapshot poll error:", err);
      if (onError) onError(err);
    }
  };

  // Immediate initial load
  runFetch();

  // Gentle background poll every 4 seconds
  intervalId = setInterval(runFetch, 4000);

  // Return unsubscribe cleanup function
  return () => {
    isStopped = true;
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}
