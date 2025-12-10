import initSqlJs, { Database, SqlJsStatic } from "sql.js";
import localforage from "localforage";
import { Transaction, TransactionType, DEFAULT_CATEGORIES, CategoryState, NeedsWantsSummary } from "../types";

const DB_NAME = "saku_sqlite.db";

class DatabaseService {
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize SQL.js with WASM from CDN
      this.SQL = await initSqlJs({
        locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
      });

      // Try to load existing DB from IndexedDB
      const savedDbBuffer = await localforage.getItem<Uint8Array>(DB_NAME);

      if (savedDbBuffer) {
        this.db = new this.SQL.Database(savedDbBuffer);
        console.log("Database loaded from storage.");
      } else {
        this.db = new this.SQL.Database();
        console.log("New database created.");
        this.initSchema();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize database:", error);
      throw error;
    }
  }

  private initSchema() {
    if (!this.db) return;

    // Create Transactions Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        date TEXT,
        amount REAL,
        category TEXT,
        description TEXT,
        type TEXT
      );
    `);

    // Create Categories Table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type TEXT
      );
    `);

    // Create Monthly Analysis Table (New)
    this.db.run(`
      CREATE TABLE IF NOT EXISTS monthly_analysis (
        month_id TEXT PRIMARY KEY,
        data TEXT
      );
    `);

    // Seed Default Categories if empty
    const result = this.db.exec("SELECT count(*) as count FROM categories");
    if (result[0].values[0][0] === 0) {
        console.log("Seeding default categories...");
        const insertStmt = this.db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)");
        
        DEFAULT_CATEGORIES.INCOME.forEach(cat => {
            insertStmt.run([cat, 'INCOME']);
        });
        DEFAULT_CATEGORIES.EXPENSE.forEach(cat => {
            insertStmt.run([cat, 'EXPENSE']);
        });
        
        insertStmt.free();
        this.save();
    }
  }

  // Persist DB to IndexedDB
  private async save() {
    if (!this.db) return;
    const data = this.db.export();
    await localforage.setItem(DB_NAME, data);
  }

  // --- Transactions ---

  async getTransactions(): Promise<Transaction[]> {
    if (!this.db) await this.init();
    
    // Check if table exists (in case of fresh load issues)
    try {
        const res = this.db!.exec("SELECT * FROM transactions ORDER BY date DESC");
        if (res.length === 0) return [];
    
        const columns = res[0].columns;
        const values = res[0].values;
    
        return values.map((row) => {
          const obj: any = {};
          columns.forEach((col, i) => {
            obj[col] = row[i];
          });
          return obj as Transaction;
        });
    } catch (e) {
        console.warn("Table might not exist yet", e);
        return [];
    }
  }

  async addTransaction(t: Transaction): Promise<void> {
    if (!this.db) await this.init();
    
    this.db!.run(
      "INSERT INTO transactions (id, date, amount, category, description, type) VALUES (?, ?, ?, ?, ?, ?)",
      [t.id, t.date, t.amount, t.category, t.description, t.type]
    );
    await this.save();
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    this.db!.run("DELETE FROM transactions WHERE id = ?", [id]);
    await this.save();
  }

  // --- Categories ---

  async getCategories(): Promise<CategoryState> {
    if (!this.db) await this.init();

    const res = this.db!.exec("SELECT name, type FROM categories");
    const categories: CategoryState = { INCOME: [], EXPENSE: [] };

    if (res.length > 0) {
        res[0].values.forEach((row) => {
            const name = row[0] as string;
            const type = row[1] as TransactionType;
            if (type === 'INCOME') categories.INCOME.push(name);
            else if (type === 'EXPENSE') categories.EXPENSE.push(name);
        });
    }
    
    // Fallback if DB is empty for some reason, though initSchema should handle it
    if (categories.INCOME.length === 0) categories.INCOME = [...DEFAULT_CATEGORIES.INCOME];
    if (categories.EXPENSE.length === 0) categories.EXPENSE = [...DEFAULT_CATEGORIES.EXPENSE];

    return categories;
  }

  async addCategory(type: TransactionType, name: string): Promise<void> {
    if (!this.db) await this.init();

    // Check duplicate
    const check = this.db!.exec("SELECT id FROM categories WHERE name = ? AND type = ?");
    if (check.length === 0) {
        this.db!.run("INSERT INTO categories (name, type) VALUES (?, ?)", [name, type]);
        await this.save();
    }
  }

  // --- Analysis Persistence ---
  
  async getMonthlyAnalysis(monthId: string): Promise<NeedsWantsSummary | null> {
    if (!this.db) await this.init();
    try {
        const res = this.db!.exec("SELECT data FROM monthly_analysis WHERE month_id = ?", [monthId]);
        if (res.length > 0 && res[0].values.length > 0) {
            return JSON.parse(res[0].values[0][0] as string);
        }
    } catch (e) {
        // Table might not exist or empty
    }
    return null;
  }

  async saveMonthlyAnalysis(monthId: string, data: NeedsWantsSummary): Promise<void> {
    if (!this.db) await this.init();
    this.db!.run(
        "INSERT OR REPLACE INTO monthly_analysis (month_id, data) VALUES (?, ?)", 
        [monthId, JSON.stringify(data)]
    );
    await this.save();
  }
}

export const db = new DatabaseService();