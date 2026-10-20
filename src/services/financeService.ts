import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  increment,
  writeBatch
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, Transaction, Budget } from "../types";

export const financeService = {
  // Simpan atau buat profil pengguna baru
  async saveUserProfile(uid: string, name: string, email: string, initialBalance: number = 0): Promise<UserProfile> {
    if (uid === "demo_user") {
      const newUser: UserProfile = {
        uid,
        name,
        email,
        balance: initialBalance,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("myfinn_demo_profile", JSON.stringify(newUser));
      return newUser;
    }

    const userRef = doc(db, "users", uid);
    try {
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }

      const newUser: UserProfile = {
        uid,
        name,
        email,
        balance: initialBalance,
        createdAt: new Date().toISOString()
      };

      await setDoc(userRef, newUser);
      return newUser;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      throw err;
    }
  },

  // Ambil data profil pengguna
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (uid === "demo_user") {
      const profileStr = localStorage.getItem("myfinn_demo_profile");
      if (profileStr) {
        return JSON.parse(profileStr) as UserProfile;
      }
      const defaultProfile: UserProfile = {
        uid: "demo_user",
        name: "Pengguna Demo",
        email: "demo@myfinn.com",
        balance: 15000000,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("myfinn_demo_profile", JSON.stringify(defaultProfile));
      return defaultProfile;
    }

    const userRef = doc(db, "users", uid);
    try {
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  // Perbarui saldo secara manual (e.g., Top Up)
  async updateBalance(uid: string, amount: number): Promise<void> {
    if (uid === "demo_user") {
      const profile = await this.getUserProfile(uid);
      if (profile) {
        profile.balance += amount;
        localStorage.setItem("myfinn_demo_profile", JSON.stringify(profile));
      }
      return;
    }

    const userRef = doc(db, "users", uid);
    try {
      await updateDoc(userRef, {
        balance: increment(amount)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  },

  // Tambah transaksi baru dan update saldo pengguna dalam satu batch
  async addTransaction(
    userId: string,
    txData: {
      type: "pemasukan" | "pengeluaran";
      nominal: number;
      category: string;
      date: string;
      note: string;
    }
  ): Promise<Transaction> {
    if (userId === "demo_user") {
      const newTx: Transaction = {
        id: "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        userId,
        ...txData,
        createdAt: new Date().toISOString()
      };
      
      const txs = await this.getTransactions(userId);
      txs.unshift(newTx);
      localStorage.setItem("myfinn_demo_transactions", JSON.stringify(txs));

      const balanceAdjustment = txData.type === "pemasukan" ? txData.nominal : -txData.nominal;
      await this.updateBalance(userId, balanceAdjustment);
      return newTx;
    }

    const batch = writeBatch(db);
    
    // 1. Buat referensi transaksi baru
    const txCollection = collection(db, "transactions");
    const txDocRef = doc(txCollection); // ID unik otomatis
    const newTx: Transaction = {
      id: txDocRef.id,
      userId,
      ...txData,
      createdAt: new Date().toISOString()
    };

    // Tambahkan transaksi ke batch
    batch.set(txDocRef, newTx);

    // 2. Sesuaikan saldo pengguna berdasarkan tipe transaksi
    const userRef = doc(db, "users", userId);
    const balanceAdjustment = txData.type === "pemasukan" ? txData.nominal : -txData.nominal;
    batch.update(userRef, {
      balance: increment(balanceAdjustment)
    });

    // Jalankan batch
    try {
      await batch.commit();
      return newTx;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${txDocRef.id}`);
      throw err;
    }
  },

  // Ambil seluruh daftar transaksi pengguna
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (userId === "demo_user") {
      const txsStr = localStorage.getItem("myfinn_demo_transactions");
      if (txsStr) {
        return JSON.parse(txsStr) as Transaction[];
      }
      const defaultTxs: Transaction[] = [
        {
          id: "demo_tx_1",
          userId: "demo_user",
          type: "pemasukan",
          nominal: 20000000,
          category: "Gaji",
          date: new Date().toISOString().split('T')[0],
          note: "Gaji Bulanan Utama",
          createdAt: new Date().toISOString()
        },
        {
          id: "demo_tx_2",
          userId: "demo_user",
          type: "pengeluaran",
          nominal: 120000,
          category: "Makanan",
          date: new Date().toISOString().split('T')[0],
          note: "Makan siang bersama tim",
          createdAt: new Date().toISOString()
        },
        {
          id: "demo_tx_3",
          userId: "demo_user",
          type: "pengeluaran",
          nominal: 450000,
          category: "Transport",
          date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          note: "Beli bensin pertamax",
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ];
      localStorage.setItem("myfinn_demo_transactions", JSON.stringify(defaultTxs));
      return defaultTxs;
    }

    const txCollection = collection(db, "transactions");
    const q = query(
      txCollection,
      where("userId", "==", userId)
    );
    try {
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        transactions.push(doc.data() as Transaction);
      });

      // Sort client-side to avoid composite index requirements in Firestore
      transactions.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        
        const createA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const createB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return createB - createA;
      });

      return transactions;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "transactions");
      return [];
    }
  },

  // Hapus transaksi dan sesuaikan kembali saldo pengguna
  async deleteTransaction(userId: string, tx: Transaction): Promise<void> {
    if (userId === "demo_user") {
      const txs = await this.getTransactions(userId);
      const updatedTxs = txs.filter(t => t.id !== tx.id);
      localStorage.setItem("myfinn_demo_transactions", JSON.stringify(updatedTxs));

      const balanceAdjustment = tx.type === "pemasukan" ? -tx.nominal : tx.nominal;
      await this.updateBalance(userId, balanceAdjustment);
      return;
    }

    const batch = writeBatch(db);
    
    // Hapus transaksi
    const txRef = doc(db, "transactions", tx.id);
    batch.delete(txRef);

    // Kembalikan efek transaksi ke saldo pengguna
    const userRef = doc(db, "users", userId);
    const balanceAdjustment = tx.type === "pemasukan" ? -tx.nominal : tx.nominal;
    batch.update(userRef, {
      balance: increment(balanceAdjustment)
    });

    try {
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${tx.id}`);
    }
  },

  // Tambah atau perbarui anggaran bulanan kategori
  async addOrUpdateBudget(
    userId: string,
    category: string,
    limit: number,
    month: string
  ): Promise<Budget> {
    if (userId === "demo_user") {
      const budgets = await this.getBudgets(userId, month);
      const existingIndex = budgets.findIndex(b => b.category === category);
      
      let updatedBudget: Budget;
      if (existingIndex > -1) {
        budgets[existingIndex].limit = limit;
        updatedBudget = budgets[existingIndex];
      } else {
        const newBudget: Budget = {
          id: "budget_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
          userId,
          category,
          limit,
          month
        };
        budgets.push(newBudget);
        updatedBudget = newBudget;
      }
      
      const allBudgetsStr = localStorage.getItem("myfinn_demo_all_budgets") || "[]";
      const allBudgets: Budget[] = JSON.parse(allBudgetsStr);
      const filteredAll = allBudgets.filter(b => !(b.userId === userId && b.category === category && b.month === month));
      filteredAll.push(updatedBudget);
      localStorage.setItem("myfinn_demo_all_budgets", JSON.stringify(filteredAll));
      
      return updatedBudget;
    }

    // Cari anggaran yang sudah ada untuk kategori dan bulan ini
    const budgetCollection = collection(db, "budgets");
    const q = query(
      budgetCollection,
      where("userId", "==", userId),
      where("category", "==", category),
      where("month", "==", month)
    );
    
    try {
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Perbarui yang sudah ada
        const existingDoc = querySnapshot.docs[0];
        const budgetId = existingDoc.id;
        const budgetRef = doc(db, "budgets", budgetId);
        
        await updateDoc(budgetRef, { limit });
        
        return {
          id: budgetId,
          userId,
          category,
          limit,
          month
        };
      } else {
        // Buat baru
        const budgetDocRef = doc(budgetCollection);
        const newBudget: Budget = {
          id: budgetDocRef.id,
          userId,
          category,
          limit,
          month
        };
        
        await setDoc(budgetDocRef, newBudget);
        return newBudget;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "budgets");
      throw err;
    }
  },

  // Ambil daftar anggaran pengguna untuk bulan tertentu
  async getBudgets(userId: string, month: string): Promise<Budget[]> {
    if (userId === "demo_user") {
      const allBudgetsStr = localStorage.getItem("myfinn_demo_all_budgets") || "[]";
      const allBudgets: Budget[] = JSON.parse(allBudgetsStr);
      const filtered = allBudgets.filter(b => b.userId === userId && b.month === month);
      if (filtered.length > 0) return filtered;
      
      const defaultBudgets: Budget[] = [
        {
          id: "demo_b_1",
          userId: "demo_user",
          category: "Makanan",
          limit: 2000000,
          month
        },
        {
          id: "demo_b_2",
          userId: "demo_user",
          category: "Transportasi",
          limit: 1000000,
          month
        },
        {
          id: "demo_b_3",
          userId: "demo_user",
          category: "Belanja",
          limit: 1500000,
          month
        }
      ];
      const newAll = [...allBudgets, ...defaultBudgets];
      localStorage.setItem("myfinn_demo_all_budgets", JSON.stringify(newAll));
      return defaultBudgets;
    }

    const budgetCollection = collection(db, "budgets");
    const q = query(
      budgetCollection,
      where("userId", "==", userId),
      where("month", "==", month)
    );
    try {
      const querySnapshot = await getDocs(q);
      const budgets: Budget[] = [];
      querySnapshot.forEach((doc) => {
        budgets.push(doc.data() as Budget);
      });
      return budgets;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "budgets");
      return [];
    }
  },

  // Ambil seluruh daftar pengguna yang terdaftar di Firestore
};
