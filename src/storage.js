// Save documents and version history snapshots in the browser
/*
IndexedDB
│
└── canvas-block-editor  （database）
        │
        ├── documents     （current）
        │       |
        │       └── current
        │
        └── snapshots     （historical version）
                |
                ├── version1
                ├── version2
                └── version3
*/
const DATABASE_NAME = "canvas-block-editor";
const STORE_NAME = "documents";
const SNAPSHOT_STORE_NAME = "snapshots";
const DOCUMENT_KEY = "current";
const MAX_SNAPSHOTS = 30;

// Open the IndexedDB database
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
      if (!request.result.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) {
        request.result.createObjectStore(SNAPSHOT_STORE_NAME, {
          keyPath: "id",
        });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open local storage."));
  });
}

// Read all historical versions
async function loadSnapshots() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE_NAME, "readonly");
    const request = transaction.objectStore(SNAPSHOT_STORE_NAME).getAll();
    request.onsuccess = () => {
      const snapshots = request.result.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      resolve(snapshots);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not load version history."));
    transaction.oncomplete = () => database.close();
  });
}

// Save a historical version
async function saveSnapshot(snapshot) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(SNAPSHOT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(SNAPSHOT_STORE_NAME);
    store.put(snapshot);
    const request = store.getAll();
    request.onsuccess = () => {
      const snapshots = request.result.sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      snapshots
        .slice(MAX_SNAPSHOTS)
        .forEach((candidate) => store.delete(candidate.id));
    };
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save this version."));
    };
  });
}

// Load the current document
async function loadDocument() {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(DOCUMENT_KEY);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not load the document."));
    transaction.oncomplete = () => database.close();
  });
}

// Save the current document
async function saveDocument(document) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(document, DOCUMENT_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error("Could not save the document."));
    };
  });
}
export { loadDocument, loadSnapshots, saveDocument, saveSnapshot };
