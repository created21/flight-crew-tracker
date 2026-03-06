// frontend/src/db/database.ts
import Dexie, { Table } from 'dexie';

export interface Flight {
  id?: number;
  flightNumber: string;
  date: string;
  aircraft: string;
  status: 'active' | 'completed' | 'synced';
  lastModified: Date;
}

export interface Task {
  id?: number;
  flightId: number;
  name: string;
  description?: string;
  order: number;
  completed: boolean;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
  synced: boolean;
}

export interface SyncQueue {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  attempts: number;
  lastAttempt?: Date;
}

class FlightDatabase extends Dexie {
  flights!: Table<Flight, number>;
  tasks!: Table<Task, number>;
  syncQueue!: Table<SyncQueue, number>;

  constructor() {
    super('FlightTrackerDB');
    
    this.version(1).stores({
      flights: '++id, flightNumber, date, status, lastModified',
      tasks: '++id, flightId, name, order, completed, synced',
      syncQueue: '++id, operation, table, attempts'
    });
  }
}

export const db = new FlightDatabase();

// Получить количество ожидающих синхронизации элементов
export async function getPendingSyncCount(): Promise<number> {
  try {
    return await db.syncQueue.count();
  } catch (error) {
    console.error('Ошибка получения количества ожидающих синхронизации:', error);
    return 0;
  }
}

// Получить информацию о синхронизации
export async function getSyncInfo() {
  try {
    const pending = await db.syncQueue.toArray();
    const flights = await db.flights.where('status').notEqual('synced').toArray();
    
    return {
      pendingCount: pending.length,
      pendingItems: pending,
      unsyncedFlights: flights.length,
      flights: flights
    };
  } catch (error) {
    console.error('Ошибка получения информации о синхронизации:', error);
    return {
      pendingCount: 0,
      pendingItems: [],
      unsyncedFlights: 0,
      flights: []
    };
  }
}

// Функция для добавления в очередь синхронизации
export async function addToSyncQueue(
  operation: SyncQueue['operation'],
  table: string,
  data: any
): Promise<void> {
  try {
    await db.syncQueue.add({
      operation,
      table,
      data,
      attempts: 0,
      lastAttempt: new Date()
    });

    console.log('✅ Добавлено в очередь синхронизации:', { operation, table });
    
  } catch (error) {
    console.error('❌ Ошибка добавления в очередь:', error);
  }
}

// Очистить очередь синхронизации
export async function clearSyncQueue() {
  try {
    await db.syncQueue.clear();
    console.log('✅ Очередь синхронизации очищена');
  } catch (error) {
    console.error('❌ Ошибка очистки очереди:', error);
  }
}