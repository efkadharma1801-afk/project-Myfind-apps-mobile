import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Save, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { Budget, CATEGORIES_PENGELUARAN, Transaction } from "../types";
import { financeService } from "../services/financeService";

interface BudgetsProps {
  userId: string;
  transactions: Transaction[];
  onBack: () => void;
}

export default function Budgets({ userId, transactions, onBack }: BudgetsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES_PENGELUARAN[0]);
  const [limitInput, setLimitInput] = useState<string>("");
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Dapatkan bulan saat ini dalam format YYYY-MM
  const currentMonth = new Date().toISOString().substring(0, 7);

  // Load budgets dari Firestore
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const data = await financeService.getBudgets(userId, currentMonth);
      setBudgets(data);
    } catch (err) {
      console.error("Error loading budgets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  // Hitung pengeluaran per kategori bulan ini
  const getCategorySpending = (category: string) => {
    return transactions
      .filter(
        (t) =>
          t.userId === userId &&
          t.type === "pengeluaran" &&
          t.category === category &&
          t.date.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + t.nominal, 0);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = Number(limitInput.replace(/\D/g, ""));
    if (!limit || limit <= 0) {
      setMessage({ type: "error", text: "Harap masukkan nominal anggaran yang valid." });
      return;
    }

    setSaveLoading(true);
    setMessage(null);

    try {
      const savedBudget = await financeService.addOrUpdateBudget(
        userId,
        selectedCategory,
        limit,
        currentMonth
      );

      // Perbarui state lokal
      setBudgets((prev) => {
        const filtered = prev.filter((b) => b.category !== selectedCategory);
        return [...filtered, savedBudget];
      });

      setLimitInput("");
      setMessage({
        type: "success",
        text: `Anggaran kategori ${selectedCategory} berhasil disimpan!`
      });
    } catch (err) {
      console.error("Error saving budget:", err);
      setMessage({ type: "error", text: "Gagal menyimpan anggaran. Coba lagi nanti." });
    } finally {
      setSaveLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Live formatter untuk input nominal anggaran
  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setLimitInput("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setLimitInput(formatted);
  };

  return (
    <div className="flex-grow flex flex-col pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 mb-6">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Batas Anggaran</h2>
      </div>

      <div className="px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Atur Anggaran Form */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Atur Batas Anggaran Baru</span>
          </h3>

          {message && (
            <div
              className={`mb-4 border p-3 rounded-xl text-sm flex items-start gap-2 animate-fadeIn ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : "bg-red-50 border-red-100 text-red-800"
              }`}
            >
              {message.type === "success" ? (
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveBudget} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Kategori Pengeluaran</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
              >
                {CATEGORIES_PENGELUARAN.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Batas Nominal (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">Rp</span>
                <input
                  type="text"
                  required
                  value={limitInput}
                  onChange={handleLimitChange}
                  placeholder="Contoh: 500.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="w-full h-[48px] rounded-xl bg-brand-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saveLoading ? "Menyimpan..." : "Simpan Anggaran"}</span>
            </button>
          </form>
        </div>

        {/* List Anggaran Aktif */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Daftar Anggaran Bulan Ini</h3>

          {loading ? (
            <div className="text-center py-8 text-sm text-slate-400">Memuat anggaran...</div>
          ) : budgets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs">Belum ada batas anggaran yang diatur.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const spent = getCategorySpending(b.category);
                const percent = Math.min(Math.round((spent / b.limit) * 100), 1000);
                
                // Cari warna progress bar sesuai status pengeluaran
                let barColor = "bg-primary";
                let textColor = "text-primary";
                let bgColor = "bg-indigo-50";

                if (spent >= b.limit) {
                  barColor = "bg-red-600 animate-pulse";
                  textColor = "text-red-700 font-bold";
                  bgColor = "bg-red-50 border border-red-100";
                } else if (percent >= 80) {
                  barColor = "bg-amber-500";
                  textColor = "text-amber-700 font-semibold";
                  bgColor = "bg-amber-50 border border-amber-100";
                }

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-col gap-2 transition-all ${bgColor}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-sm">{b.category}</span>
                      <span className={`text-xs font-medium ${textColor}`}>
                        {percent}% Terpakai
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                      <span>Terpakai: <strong className="text-slate-700">{formatCurrency(spent)}</strong></span>
                      <span>Batas: <strong className="text-slate-700">{formatCurrency(b.limit)}</strong></span>
                    </div>

                    {percent >= 80 && percent < 100 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-700 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Peringatan: Pengeluaran hampir melewati batas batas anggaran!</span>
                      </div>
                    )}

                    {percent >= 100 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-700 mt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                        <span>Kritis: Pengeluaran Anda telah melampaui batas anggaran!</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
