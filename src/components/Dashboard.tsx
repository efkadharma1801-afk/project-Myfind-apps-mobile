import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Plus,
  ArrowDown,
  ArrowUp,
  PieChart,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  Sparkles,
  DollarSign,
  Bell,
  HelpCircle,
  X
} from "lucide-react";
import { Transaction, UserProfile, CATEGORY_ICONS, CATEGORY_COLORS } from "../types";
import { financeService } from "../services/financeService";
import * as LucideIcons from "lucide-react";

interface DashboardProps {
  userProfile: UserProfile;
  transactions: Transaction[];
  onNavigate: (screen: "ADD_TRANSACTION" | "REPORTS" | "BUDGETS" | "PROFILE") => void;
  onSetTxTypePreselected: (type: "pemasukan" | "pengeluaran") => void;
  onRefreshData: () => Promise<void>;
}

// Map Lucide components for categories
const iconMap: Record<string, React.ComponentType<any>> = {
  restaurant: LucideIcons.Utensils,
  directions_car: LucideIcons.Car,
  shopping_bag: LucideIcons.ShoppingBag,
  receipt_long: LucideIcons.FileText,
  sports_esports: LucideIcons.Gamepad2,
  medical_services: LucideIcons.Activity,
  work: LucideIcons.Briefcase,
  trending_up: LucideIcons.TrendingUp,
  monetization_on: LucideIcons.Coins,
  featured_play_list: LucideIcons.Gift,
  help_outline: LucideIcons.HelpCircle
};

export default function Dashboard({
  userProfile,
  transactions,
  onNavigate,
  onSetTxTypePreselected,
  onRefreshData
}: DashboardProps) {
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmountInput, setTopUpAmountInput] = useState<string>("");
  const [topUpLoading, setTopUpLoading] = useState<boolean>(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  // Dapatkan Salam berdasarkan jam hari ini
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 11) return "Selamat pagi,";
    if (hours < 15) return "Selamat siang,";
    if (hours < 18) return "Selamat sore,";
    return "Selamat malam,";
  };

  // Hitung total pemasukan dan pengeluaran secara real-time dari seluruh transaksi
  const totalIncome = transactions
    .filter((t) => t.type === "pemasukan")
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "pengeluaran")
    .reduce((sum, t) => sum + t.nominal, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(topUpAmountInput.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setTopUpError("Harap masukkan nominal top up yang valid.");
      return;
    }

    setTopUpLoading(true);
    setTopUpError(null);

    try {
      await financeService.updateBalance(userProfile.uid, amount);
      await onRefreshData();
      setShowTopUpModal(false);
      setTopUpAmountInput("");
    } catch (err) {
      console.error("Top up error:", err);
      setTopUpError("Gagal melakukan top up. Silakan coba lagi.");
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleTopUpAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setTopUpAmountInput("");
      return;
    }
    const formatted = new Intl.NumberFormat("id-ID").format(Number(rawValue));
    setTopUpAmountInput(formatted);
  };

  const handleDeleteTx = async (tx: Transaction) => {
    if (window.confirm(`Hapus transaksi "${tx.category} - ${formatCurrency(tx.nominal)}"?`)) {
      try {
        await financeService.deleteTransaction(userProfile.uid, tx);
        await onRefreshData();
      } catch (err) {
        console.error("Error deleting transaction:", err);
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  const formatDateText = (dateIso: string) => {
    try {
      const today = new Date().toISOString().substring(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().substring(0, 10);

      if (dateIso === today) {
        return "Hari ini";
      } else if (dateIso === yesterday) {
        return "Kemarin";
      } else {
        const d = new Date(dateIso);
        return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
      }
    } catch (e) {
      return dateIso;
    }
  };

  return (
    <div className="flex-grow flex flex-col space-y-6 pt-4 pb-24">
      {/* Top Bar / Header */}
      <header className="flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("PROFILE")}
            className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-primary font-bold text-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            {userProfile.name.charAt(0).toUpperCase()}
          </button>
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-medium">{getGreeting()}</span>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent leading-tight">
              Halo, {userProfile.name}!
            </h1>
          </div>
        </div>

        <button
          onClick={() => alert("Anda tidak memiliki notifikasi baru saat ini.")}
          className="w-10 h-10 flex items-center justify-center rounded-full text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-colors relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full"></span>
        </button>
      </header>

      {/* Main Container */}
      <main className="px-6 space-y-6 max-w-md mx-auto w-full">
        {/* Balance Card */}
        <section className="bg-brand-gradient text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-white/80 uppercase tracking-widest">Total Saldo</span>
              <button
                type="button"
                onClick={() => setShowBalance(!showBalance)}
                className="text-white hover:text-white/80 transition-colors focus:outline-none cursor-pointer p-1"
              >
                {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-3xl font-extrabold tracking-tight h-10 flex items-center">
              {showBalance ? formatCurrency(userProfile.balance) : "••••••••••"}
            </div>

            <div className="mt-4 flex">
              <button
                onClick={() => setShowTopUpModal(true)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Top Up Saldo</span>
              </button>
            </div>
          </div>
        </section>

        {/* Summary columns */}
        <section className="grid grid-cols-2 gap-4">
          {/* Income Column */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemasukan</span>
              <span className="text-sm font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
            </div>
          </div>

          {/* Expense Column */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pengeluaran</span>
              <span className="text-sm font-bold text-rose-600">{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </section>

        {/* Quick Menu Grid */}
        <section className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={() => {
              onSetTxTypePreselected("pemasukan");
              onNavigate("ADD_TRANSACTION");
            }}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 text-primary flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-all border border-slate-200/65">
              <ArrowDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Pemasukan</span>
          </button>

          <button
            onClick={() => {
              onSetTxTypePreselected("pengeluaran");
              onNavigate("ADD_TRANSACTION");
            }}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 text-primary flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-all border border-slate-200/65">
              <ArrowUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Pengeluaran</span>
          </button>

          <button
            onClick={() => onNavigate("BUDGETS")}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 text-primary flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-all border border-slate-200/65">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Anggaran</span>
          </button>

          <button
            onClick={() => onNavigate("REPORTS")}
            className="flex flex-col items-center gap-1.5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 text-primary flex items-center justify-center group-hover:bg-primary-container group-hover:text-white transition-all border border-slate-200/65">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-600">Laporan</span>
          </button>
        </section>

        {/* Carousel / Banner Tips */}
        <section className="bg-indigo-50 border border-indigo-100/60 rounded-2xl p-4 flex gap-3 relative overflow-hidden shadow-sm">
          <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-100/30 rounded-full blur-xl"></div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Tips Hari Ini</span>
            <h4 className="text-sm font-bold text-slate-800 leading-tight">Catat transaksi hari ini</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Disiplin mencatat pemasukan & pengeluaran membantu Anda mencapai Financial Freedom lebih cepat!
            </p>
          </div>
        </section>

        {/* Recent Transactions List */}
        <section className="space-y-3 pb-8">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800">Transaksi Terbaru</h2>
            {transactions.length > 0 && (
              <button
                onClick={() => onNavigate("REPORTS")}
                className="text-xs font-semibold text-primary hover:text-indigo-700 transition-colors cursor-pointer"
              >
                Lihat Semua
              </button>
            )}
          </div>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-8 text-center text-slate-400">
              <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs">Belum ada transaksi terekam.</p>
              <button
                onClick={() => onNavigate("ADD_TRANSACTION")}
                className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Catat Transaksi Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx) => {
                // Ambil info ikon & warna berdasarkan kategori
                const iconName = CATEGORY_ICONS[tx.category] || "help_outline";
                const colorClasses = CATEGORY_COLORS[tx.category] || "bg-gray-100 text-gray-700 border-gray-200";
                
                // Cari Lucide Icon Component secara dinamis
                const LucideIcon = iconMap[iconName] || LucideIcons.HelpCircle;

                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/50 shadow-sm flex items-center justify-between group transition-all hover:bg-slate-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${colorClasses.split(" ")[0]} ${colorClasses.split(" ")[1]}`}>
                        <LucideIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 leading-tight">
                          {tx.category}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-400 font-medium">
                            {formatDateText(tx.date)}
                          </span>
                          {tx.note && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-400 font-normal truncate max-w-[120px]">
                                {tx.note}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold ${
                          tx.type === "pemasukan" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {tx.type === "pemasukan" ? "+" : "-"}
                        {formatCurrency(tx.nominal)}
                      </span>
                      <button
                        onClick={() => handleDeleteTx(tx)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Top Up Modal Overlay */}
      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm border border-slate-100 p-6 shadow-xl relative animate-scaleUp">
            <button
              onClick={() => {
                setShowTopUpModal(false);
                setTopUpAmountInput("");
                setTopUpError(null);
              }}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Top Up Saldo</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-normal">
              Masukkan nominal tambahan saldo ke total saldo Anda saat ini.
            </p>

            {topUpError && (
              <div className="mb-4 bg-red-50 border border-red-100 text-red-800 text-xs p-3 rounded-xl">
                {topUpError}
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">Rp</span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={topUpAmountInput}
                  onChange={handleTopUpAmountChange}
                  placeholder="Contoh: 150.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-sm text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all h-[48px]"
                />
              </div>

              {/* Quick option badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[50000, 100000, 250000, 500000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      const formatted = new Intl.NumberFormat("id-ID").format(val);
                      setTopUpAmountInput(formatted);
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer"
                  >
                    +{formatCurrency(val).replace("Rp", "").trim()}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={topUpLoading}
                className="w-full h-[48px] rounded-xl bg-brand-gradient text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-indigo-100 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{topUpLoading ? "Memproses..." : "Konfirmasi Top Up"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
