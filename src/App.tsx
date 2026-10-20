import React, { useState, useEffect } from "react";
import { onAuthStateChanged, getRedirectResult, User } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Plus,
  PieChart,
  User as UserIcon,
  TrendingDown,
  Activity,
  LogOut
} from "lucide-react";
import { auth } from "./firebase";
import { financeService } from "./services/financeService";
import { ScreenType, UserProfile, Transaction } from "./types";

// Import Components
import Onboarding from "./components/Onboarding";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import AddTransaction from "./components/AddTransaction";
import Reports from "./components/Reports";
import Budgets from "./components/Budgets";
import Profile from "./components/Profile";

export default function App() {
  const [screen, setScreen] = useState<ScreenType>("SPLASH");
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txTypePreselected, setTxTypePreselected] = useState<"pemasukan" | "pengeluaran">("pengeluaran");
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Tampilkan Splash Screen minimal 2 detik
  useEffect(() => {
    // Tangani hasil sign in redirect Google (sangat penting untuk HP/tablet)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          const firebaseUser = result.user;
          setUser(firebaseUser);
          try {
            let profile = await financeService.getUserProfile(firebaseUser.uid);
            if (!profile) {
              profile = await financeService.saveUserProfile(
                firebaseUser.uid,
                firebaseUser.displayName || "Pengguna Google",
                firebaseUser.email || "",
                100000
              );
            }
            setUserProfile(profile);
            const txs = await financeService.getTransactions(firebaseUser.uid);
            setTransactions(txs);
            setScreen("DASHBOARD");
          } catch (err) {
            console.error("Error loading redirected user:", err);
          }
        }
      })
      .catch((err) => {
        console.error("Redirect sign-in error:", err);
      });

    const splashTimer = setTimeout(() => {
      // Periksa apakah onboarding telah selesai sebelumnya
      const onboardingCompleted = localStorage.getItem("myfinn_onboarding_completed");
      const isDemoActive = localStorage.getItem("myfinn_demo_active_user") === "true";

      if (isDemoActive) {
        const demoUserObj = { uid: "demo_user", email: "demo@myfinn.com", displayName: "Pengguna Demo" };
        setUser(demoUserObj as any);
        financeService.getUserProfile("demo_user").then(async (profile) => {
          if (profile) {
            setUserProfile(profile);
            const txs = await financeService.getTransactions("demo_user");
            setTransactions(txs);
            setScreen("DASHBOARD");
          } else {
            setScreen("LOGIN");
          }
          setLoading(false);
        }).catch((err) => {
          console.error("Error loading demo profile:", err);
          setScreen("LOGIN");
          setLoading(false);
        });
        return;
      }
      
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
          try {
            let profile = await financeService.getUserProfile(firebaseUser.uid);
            if (!profile) {
              // Jika profil belum ada (misal login Google pertama kali atau redirect terganggu), buat otomatis
              profile = await financeService.saveUserProfile(
                firebaseUser.uid,
                firebaseUser.displayName || "Pengguna Baru",
                firebaseUser.email || "",
                100000 // Saldo awal default Rp 100k
              );
            }
            setUserProfile(profile);
            const txs = await financeService.getTransactions(firebaseUser.uid);
            setTransactions(txs);
            setScreen("DASHBOARD");
          } catch (err) {
            console.error("Error loading user state, proceeding to Dashboard anyway:", err);
            // Jangan tendang user keluar ke LOGIN jika ada masalah loading transaksi,
            // buat profil palsu minimal agar halaman Dashboard tidak crash
            if (firebaseUser) {
              const fallbackProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Pengguna",
                email: firebaseUser.email || "",
                balance: 100000,
                createdAt: new Date().toISOString()
              };
              setUserProfile(fallbackProfile);
              setScreen("DASHBOARD");
            } else {
              setScreen("LOGIN");
            }
          }
        } else {
          setUser(null);
          setUserProfile(null);
          setTransactions([]);
          if (onboardingCompleted === "true") {
            setScreen("LOGIN");
          } else {
            setScreen("ONBOARDING1");
          }
        }
        setLoading(false);
      });
    }, 2000);

    return () => clearTimeout(splashTimer);
  }, []);

  // Segarkan seluruh data user (Saldo & Transaksi) dari Firestore atau LocalStorage
  const refreshUserData = async () => {
    const activeUid = user?.uid || (localStorage.getItem("myfinn_demo_active_user") === "true" ? "demo_user" : null);
    if (!activeUid) return;
    try {
      const profile = await financeService.getUserProfile(activeUid);
      if (profile) {
        setUserProfile(profile);
      }
      const txs = await financeService.getTransactions(activeUid);
      setTransactions(txs);
    } catch (err) {
      console.error("Error refreshing data:", err);
    }
  };

  // Selesaikan Onboarding slide
  const handleOnboardingComplete = () => {
    localStorage.setItem("myfinn_onboarding_completed", "true");
    setScreen("LOGIN");
  };

  // Auth berhasil
  const handleAuthSuccess = async (uid: string) => {
    setLoading(true);
    try {
      const profile = await financeService.getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
        const txs = await financeService.getTransactions(uid);
        setTransactions(txs);
        setScreen("DASHBOARD");
      }
    } catch (err) {
      console.error("Error on auth success profile load:", err);
    } finally {
      setLoading(false);
    }
  };

  // Tambah transaksi berhasil
  const handleAddTxSuccess = async () => {
    await refreshUserData();
    setScreen("DASHBOARD");
  };

  // Update nama berhasil
  const handleUpdateName = (newName: string) => {
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        name: newName
      });
    }
  };

  // Render Layar sesuai State Aktif
  const renderActiveScreen = () => {
    switch (screen) {
      case "SPLASH":
        return (
          <div className="h-screen w-screen bg-brand-gradient flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 blur-[100px] rounded-full mix-blend-overlay"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 blur-[120px] rounded-full mix-blend-overlay"></div>
            
            <div className="flex flex-col items-center justify-center flex-1 z-10 animate-fade-in-up">
              <div className="w-32 h-32 mb-6 rounded-3xl overflow-hidden shadow-2xl bg-white/20 backdrop-blur-md p-4 border border-white/30 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-primary shadow-inner">
                  <span className="text-5xl font-extrabold font-sans tracking-tighter">F</span>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                MyFinn
              </h1>
            </div>
            
            <div className="absolute bottom-12 w-full text-center z-10 px-6 opacity-90">
              <p className="text-base text-white/95 font-semibold tracking-wide">
                Atur uangmu, capai tujuanmu.
              </p>
            </div>
          </div>
        );

      case "ONBOARDING1":
      case "ONBOARDING2":
      case "ONBOARDING3":
        return <Onboarding onComplete={handleOnboardingComplete} />;

      case "LOGIN":
      case "REGISTER":
        return <Auth onAuthSuccess={handleAuthSuccess} />;

      case "DASHBOARD":
        if (!userProfile) return null;
        return (
          <Dashboard
            userProfile={userProfile}
            transactions={transactions}
            onNavigate={setScreen}
            onSetTxTypePreselected={setTxTypePreselected}
            onRefreshData={refreshUserData}
          />
        );

      case "ADD_TRANSACTION":
        if (!user) return null;
        return (
          <AddTransaction
            userId={user.uid}
            initialType={txTypePreselected}
            onSuccess={handleAddTxSuccess}
            onBack={() => setScreen("DASHBOARD")}
          />
        );

      case "REPORTS":
        return (
          <Reports
            transactions={transactions}
            onBack={() => setScreen("DASHBOARD")}
          />
        );

      case "BUDGETS":
        if (!user) return null;
        return (
          <Budgets
            userId={user.uid}
            transactions={transactions}
            onBack={() => setScreen("DASHBOARD")}
          />
        );

      case "PROFILE":
        if (!userProfile) return null;
        return (
          <Profile
            userProfile={userProfile}
            onBack={() => setScreen("DASHBOARD")}
            onUpdateName={handleUpdateName}
          />
        );

      default:
        return null;
    }
  };

  // Navigasi bagian bawah untuk pengguna yang login
  const showBottomNav =
    user &&
    screen !== "SPLASH" &&
    screen !== "LOGIN" &&
    screen !== "REGISTER" &&
    screen !== "ONBOARDING1" &&
    screen !== "ONBOARDING2" &&
    screen !== "ONBOARDING3";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative font-sans">
      {/* Content Area */}
      <div className="flex-grow flex flex-col">
        {renderActiveScreen()}
      </div>

      {/* Persistent Bottom Nav Bar (Mobile layout friendly) */}
      {showBottomNav && (
        <nav className="fixed bottom-0 w-full z-40 rounded-t-2xl bg-white/90 backdrop-blur-lg shadow-[0_-4px_12px_rgba(0,0,0,0.05)] border-t border-slate-100">
          <div className="flex justify-around items-end px-2 pb-safe pt-2 h-20 w-full max-w-md mx-auto relative">
            
            {/* Beranda */}
            <button
              onClick={() => setScreen("DASHBOARD")}
              className={`flex flex-col items-center justify-center transition-all duration-300 w-14 mb-2 cursor-pointer ${
                screen === "DASHBOARD" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Home className={`w-6 h-6 mb-1 ${screen === "DASHBOARD" ? "stroke-[2.5px]" : ""}`} />
              <span className="text-[10px] font-semibold">Beranda</span>
            </button>

            {/* Batas Anggaran */}
            <button
              onClick={() => setScreen("BUDGETS")}
              className={`flex flex-col items-center justify-center transition-colors w-14 mb-2 cursor-pointer ${
                screen === "BUDGETS" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <TrendingDown className={`w-6 h-6 mb-1 ${screen === "BUDGETS" ? "stroke-[2.5px]" : ""}`} />
              <span className="text-[10px] font-semibold">Anggaran</span>
            </button>

            {/* Tambah Transaksi FAB */}
            <button
              onClick={() => {
                setTxTypePreselected("pengeluaran");
                setScreen("ADD_TRANSACTION");
              }}
              className="flex items-center justify-center bg-brand-gradient text-white rounded-full -translate-y-4 w-14 h-14 shadow-lg shadow-indigo-200 hover:opacity-95 active:scale-95 duration-200 cursor-pointer border-4 border-slate-50"
            >
              <Plus className="w-8 h-8 font-bold" />
            </button>

            {/* Laporan */}
            <button
              onClick={() => setScreen("REPORTS")}
              className={`flex flex-col items-center justify-center transition-colors w-14 mb-2 cursor-pointer ${
                screen === "REPORTS" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <PieChart className={`w-6 h-6 mb-1 ${screen === "REPORTS" ? "stroke-[2.5px]" : ""}`} />
              <span className="text-[10px] font-semibold">Laporan</span>
            </button>

            {/* Profil */}
            <button
              onClick={() => setScreen("PROFILE")}
              className={`flex flex-col items-center justify-center transition-colors w-14 mb-2 cursor-pointer ${
                screen === "PROFILE" ? "text-primary font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <UserIcon className={`w-6 h-6 mb-1 ${screen === "PROFILE" ? "stroke-[2.5px]" : ""}`} />
              <span className="text-[10px] font-semibold">Profil</span>
            </button>

          </div>
        </nav>
      )}
    </div>
  );
}
