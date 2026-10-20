import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, AlertCircle } from "lucide-react";
import { Transaction } from "../types";

interface ReportsProps {
  transactions: Transaction[];
  onBack: () => void;
}

const COLORS = ["#4648d4", "#2170e4", "#006c49", "#00885d", "#ba1a1a", "#ffdad6", "#adc6ff", "#767586"];

export default function Reports({ transactions, onBack }: ReportsProps) {
  // Hitung total pemasukan dan pengeluaran
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

  // 1. Data untuk Perbandingan Pemasukan vs Pengeluaran
  const comparisonData = [
    {
      name: "Keuangan",
      Pemasukan: totalIncome,
      Pengeluaran: totalExpense
    }
  ];

  // 2. Data Pengeluaran Berdasarkan Kategori
  const categoryExpensesMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "pengeluaran")
    .forEach((t) => {
      categoryExpensesMap[t.category] = (categoryExpensesMap[t.category] || 0) + t.nominal;
    });

  const categoryExpensesData = Object.keys(categoryExpensesMap).map((cat) => ({
    name: cat,
    value: categoryExpensesMap[cat]
  }));

  // 3. Data Tren Keuangan Harian (7 entri terakhir)
  const dailyHistoryMap: Record<string, { income: number; expense: number }> = {};
  // Urutkan transaksi dari terlama ke terbaru untuk tren garis waktu
  const sortedTx = [...transactions].reverse();
  
  sortedTx.forEach((t) => {
    // Ambil tanggal pendek e.g., "24 Jun" dari "2026-06-24"
    let dateStr = t.date;
    try {
      const parts = t.date.split("-");
      if (parts.length === 3) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const day = parseInt(parts[2]);
        const month = monthNames[parseInt(parts[1]) - 1];
        dateStr = `${day} ${month}`;
      }
    } catch (e) {}

    if (!dailyHistoryMap[dateStr]) {
      dailyHistoryMap[dateStr] = { income: 0, expense: 0 };
    }
    
    if (t.type === "pemasukan") {
      dailyHistoryMap[dateStr].income += t.nominal;
    } else {
      dailyHistoryMap[dateStr].expense += t.nominal;
    }
  });

  const trendData = Object.keys(dailyHistoryMap).map((date) => ({
    date,
    Pemasukan: dailyHistoryMap[date].income,
    Pengeluaran: dailyHistoryMap[date].expense
  })).slice(-7); // Ambil maksimal 7 hari terakhir

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
        <h2 className="text-xl font-bold text-slate-800">Laporan Keuangan</h2>
      </div>

      {transactions.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center px-6 py-12 text-center my-auto">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
            <Calendar className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Transaksi</h3>
          <p className="text-sm text-slate-500 max-w-xs mb-6">
            Silakan tambahkan transaksi baru terlebih dahulu untuk melihat visualisasi laporan Anda.
          </p>
        </div>
      ) : (
        <div className="px-6 space-y-6 max-w-md mx-auto w-full">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Pemasukan</span>
              </div>
              <span className="text-base font-bold text-emerald-800 leading-tight">
                {formatCurrency(totalIncome)}
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex flex-col">
              <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>Pengeluaran</span>
              </div>
              <span className="text-base font-bold text-rose-800 leading-tight">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Chart 1: Perbandingan Cashflow */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
              <span>Rasio Pemasukan vs Pengeluaran</span>
            </h3>
            <div className="h-60 w-full font-sans text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val) => `Rp ${val / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Pemasukan" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Tren Harian */}
          {trendData.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Tren Transaksi Terakhir</h3>
              <div className="h-60 w-full font-sans text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(val) => `${val / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Line type="monotone" dataKey="Pemasukan" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Chart 3: Distribusi Kategori Pengeluaran */}
          {categoryExpensesData.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Pengeluaran per Kategori</h3>
              <div className="h-60 w-full font-sans text-xs flex justify-center items-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryExpensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend list with actual amounts */}
              <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                {categoryExpensesData.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Belum ada rincian kategori pengeluaran.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
