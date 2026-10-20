import React, { useState } from "react";
import { ArrowLeft, Calendar, FileText, CheckCircle2 } from "lucide-react";
import {
  CATEGORIES_PEMASUKAN,
  CATEGORIES_PENGELUARAN,
  CATEGORY_COLORS
} from "../types";
import { financeService } from "../services/financeService";

interface AddTransactionProps {
  userId: string;
  initialType?: "pemasukan" | "pengeluaran";
  onSuccess: () => void;
  onBack: () => void;
}

export default function AddTransaction({ userId, initialType = "pengeluaran", onSuccess, onBack }: AddTransactionProps) {
  const [type, setType] = useState<"pemasukan" | "pengeluaran">(initialType);
  const [nominal, setNominal] = useState<string>("");
  const [category, setCategory] = useState<string>(initialType === "pemasukan" ? CATEGORIES_PEMASUKAN[0] : CATEGORIES_PENGELUARAN[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const categories = type === "pemasukan" ? CATEGORIES_PEMASUKAN : CATEGORIES_PENGELUARAN;

  const handleTypeChange = (newType: "pemasukan" | "pengeluaran") => {
    setType(newType);
    setCategory(newType === "pemasukan" ? CATEGORIES_PEMASUKAN[0] : CATEGORIES_PENGELUARAN[0]);
  };

  // Live formatting mata uang Rupiah
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setNominal("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setNominal(formatted);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNominal = Number(nominal.replace(/\D/g, ""));
    if (!cleanNominal || cleanNominal <= 0) {
      setError("Harap masukkan nominal transaksi yang valid.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await financeService.addTransaction(userId, {
        type,
        nominal: cleanNominal,
        category,
        date,
        note
      });
      onSuccess();
    } catch (err) {
      console.error("Error adding transaction:", err);
      setError("Gagal menyimpan transaksi. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-xl font-bold text-slate-800">Tambah Transaksi</h2>
      </div>

      <main className="w-full max-w-md mx-auto px-6 flex flex-col">
        {/* Custom Segmented Control */}
        <div className="flex w-full bg-slate-100 rounded-xl p-1 relative z-0 mb-8 border border-slate-200">
          <button
            type="button"
            onClick={() => handleTypeChange("pengeluaran")}
            className={`flex-1 py-2.5 text-center rounded-lg font-semibold text-sm transition-all duration-200 ${
              type === "pengeluaran"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("pemasukan")}
            className={`flex-1 py-2.5 text-center rounded-lg font-semibold text-sm transition-all duration-200 ${
              type === "pemasukan"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pemasukan
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Nominal Input */}
          <div className="flex flex-col items-center justify-center mb-6">
            <label className="text-xs font-semibold text-slate-400 mb-2 tracking-widest uppercase">
              Nominal Transaksi
            </label>
            <div className="flex items-baseline justify-center w-full relative">
              <span
                className={`font-bold text-2xl mr-1 relative top-[-4px] transition-colors ${
                  type === "pemasukan" ? "text-emerald-600" : "text-primary"
                }`}
              >
                Rp
              </span>
              <input
                type="text"
                required
                value={nominal}
                onChange={handleNominalChange}
                placeholder="0"
                className={`w-full text-center bg-transparent border-none focus:ring-0 font-extrabold text-4xl p-0 m-0 outline-none transition-colors ${
                  type === "pemasukan"
                    ? "text-emerald-600 caret-emerald-600"
                    : "text-primary caret-primary"
                }`}
              />
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-5">
            {/* Kategori Horizontal List */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-3">Kategori</label>
              <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 -mx-2 px-2">
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? type === "pemasukan"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : "bg-primary text-white border-primary"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tanggal Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Tanggal</label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-[48px]"
                />
              </div>
            </div>

            {/* Catatan Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Catatan</label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tulis rincian transaksi (opsional)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-24 placeholder:text-slate-400 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold text-base h-[56px] rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:opacity-95 ${
              type === "pemasukan"
                ? "bg-emerald-500 shadow-emerald-100"
                : "bg-brand-gradient shadow-indigo-100"
            }`}
          >
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </form>
      </main>
    </div>
  );
}
