import { openDB, DBSchema, IDBPDatabase } from "idb";
import { MemoryRecord, ResearchDelta, ResearchSession, SourceRecord } from "@/lib/types";

interface StoredSourceRecord extends SourceRecord {
  storageId?: string;
}

interface RecallDBSchema extends DBSchema {
  sessions: {
    key: string;
    value: ResearchSession;
    indexes: {
      "by-topic": string;
      "by-date": string;
    };
  };
  memories: {
    key: string;
    value: MemoryRecord;
    indexes: {
      "by-topic": string;
      "by-type": string;
      "by-pinned": number;
      "by-date": string;
    };
  };
  sources: {
    key: string;
    value: StoredSourceRecord;
    indexes: {
      "by-url": string;
    };
  };
  deltas: {
    key: string;
    value: ResearchDelta;
    indexes: {
      "by-session": string;
    };
  };
}

const DB_NAME = "RecallResearchDB";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<RecallDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<RecallDBSchema>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only accessible in the browser environment."));
  }

  if (!dbPromise) {
    dbPromise = openDB<RecallDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // 1. Sessions store
        if (!db.objectStoreNames.contains("sessions")) {
          const sessionStore = db.createObjectStore("sessions", { keyPath: "id" });
          sessionStore.createIndex("by-topic", "topicKey");
          sessionStore.createIndex("by-date", "createdAt");
        }

        // 2. Memories store
        if (!db.objectStoreNames.contains("memories")) {
          const memoryStore = db.createObjectStore("memories", { keyPath: "id" });
          memoryStore.createIndex("by-topic", "topicKey");
          memoryStore.createIndex("by-type", "type");
          memoryStore.createIndex("by-pinned", "pinned");
          memoryStore.createIndex("by-date", "createdAt");
        }

        // 3. Sources store (Upgraded in v2 to use storageId to avoid S1/S2 collisions across sessions)
        if (oldVersion < 2 && db.objectStoreNames.contains("sources")) {
          db.deleteObjectStore("sources");
        }
        if (!db.objectStoreNames.contains("sources")) {
          const sourceStore = db.createObjectStore("sources", { keyPath: "storageId" });
          sourceStore.createIndex("by-url", "url");
        }

        // 4. Research Deltas store
        if (!db.objectStoreNames.contains("deltas")) {
          const deltaStore = db.createObjectStore("deltas", { keyPath: "id" });
          deltaStore.createIndex("by-session", "currentSessionId");
        }
      },
    });
  }

  return dbPromise;
}

export const StorageRepository = {
  // Session operations
  async saveSession(session: ResearchSession): Promise<void> {
    const db = await getDb();
    await db.put("sessions", session);
  },

  async getSession(id: string): Promise<ResearchSession | undefined> {
    const db = await getDb();
    return db.get("sessions", id);
  },

  async listSessions(): Promise<ResearchSession[]> {
    const db = await getDb();
    const sessions = await db.getAllFromIndex("sessions", "by-date");
    return sessions.reverse(); // newest first
  },

  async deleteSession(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("sessions", id);
  },

  // Memory operations
  async saveMemory(memory: MemoryRecord): Promise<void> {
    const db = await getDb();
    await db.put("memories", memory);
  },

  async saveMemories(memories: MemoryRecord[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("memories", "readwrite");
    for (const mem of memories) {
      await tx.store.put(mem);
    }
    await tx.done;
  },

  async getMemory(id: string): Promise<MemoryRecord | undefined> {
    const db = await getDb();
    return db.get("memories", id);
  },

  async listMemories(filter?: {
    topicKey?: string;
    type?: string;
    pinnedOnly?: boolean;
    searchQuery?: string;
  }): Promise<MemoryRecord[]> {
    const db = await getDb();
    let records = await db.getAllFromIndex("memories", "by-date");
    records = records.reverse(); // newest first

    if (filter) {
      if (filter.topicKey) {
        records = records.filter(
          (m) => m.topicKey.toLowerCase() === filter.topicKey!.toLowerCase()
        );
      }
      if (filter.type) {
        records = records.filter((m) => m.type === filter.type);
      }
      if (filter.pinnedOnly) {
        records = records.filter((m) => m.pinned);
      }
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim();
        records = records.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.content.toLowerCase().includes(q) ||
            m.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
    }

    return records;
  },

  async updateMemory(id: string, updates: Partial<MemoryRecord>): Promise<MemoryRecord | undefined> {
    const db = await getDb();
    const existing = await db.get("memories", id);
    if (!existing) return undefined;

    const updated: MemoryRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.put("memories", updated);
    return updated;
  },

  async deleteMemory(id: string): Promise<void> {
    const db = await getDb();
    await db.delete("memories", id);
  },

  // Source operations
  async saveSources(sources: SourceRecord[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction("sources", "readwrite");
    for (const src of sources) {
      const storageRecord: StoredSourceRecord = {
        ...src,
        storageId: `${src.sessionIds?.[0] || "global"}_${src.id}`,
      };
      await tx.store.put(storageRecord);
    }
    await tx.done;
  },

  async listAllSources(): Promise<SourceRecord[]> {
    const db = await getDb();
    return db.getAll("sources");
  },

  // Delta operations
  async saveDelta(delta: ResearchDelta): Promise<void> {
    const db = await getDb();
    await db.put("deltas", delta);
  },

  async getDelta(id: string): Promise<ResearchDelta | undefined> {
    const db = await getDb();
    return db.get("deltas", id);
  },

  // Full export & wipe
  async exportFullBackup(): Promise<string> {
    const db = await getDb();
    const sessions = await db.getAll("sessions");
    const memories = await db.getAll("memories");
    const sources = await db.getAll("sources");
    const deltas = await db.getAll("deltas");

    const exportPayload = {
      version: 2,
      appName: "Recall Research",
      exportedAt: new Date().toISOString(),
      counts: {
        sessions: sessions.length,
        memories: memories.length,
        sources: sources.length,
        deltas: deltas.length,
      },
      data: {
        sessions,
        memories,
        sources,
        deltas,
      },
    };

    return JSON.stringify(exportPayload, null, 2);
  },

  async clearAll(): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(["sessions", "memories", "sources", "deltas"], "readwrite");
    await tx.objectStore("sessions").clear();
    await tx.objectStore("memories").clear();
    await tx.objectStore("sources").clear();
    await tx.objectStore("deltas").clear();
    await tx.done;
  },
};
