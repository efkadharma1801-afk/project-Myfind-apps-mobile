import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider
} from "firebase/auth";
import { Mail, Lock, User, Wallet, Eye, EyeOff, AlertCircle, Play } from "lucide-react";
import { auth } from "../firebase";
import { financeService } from "../services/financeService";

interface AuthProps {
  onAuthSuccess: (uid: string) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [initialBalance, setInitialBalance] = useState<number>(100000); // Saldo awal Rp 100k bawaan
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getIndonesianErrorMessage = (errCode: string): string => {
    switch (errCode) {
      case "auth/invalid-email":
        return "Format alamat email tidak valid.";
      case "auth/user-disabled":
        return "Akun ini telah dinonaktifkan.";
      case "auth/user-not-found":
        return "Pengguna tidak ditemukan. Silakan daftar terlebih dahulu.";
      case "auth/wrong-password":
        return "Kata sandi yang Anda masukkan salah.";
      case "auth/email-already-in-use":
        return "Alamat email ini sudah terdaftar oleh pengguna lain.";
      case "auth/weak-password":
        return "Kata sandi terlalu lemah. Minimal harus terdiri dari 6 karakter.";
      case "auth/network-request-failed":
        return "Koneksi jaringan gagal. Harap periksa internet Anda.";
      case "auth/operation-not-allowed":
        return "Metode pendaftaran Email/Password belum diaktifkan di Firebase Console Anda. Silakan masuk menggunakan tombol 'Masuk dengan Google' di bawah ini yang langsung berfungsi secara aman.";
      default:
        return "Terjadi kesalahan. Harap coba lagi nanti.";
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      
      // Deteksi apakah perangkat seluler (HP) atau tablet
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Pada perangkat HP, gunakan Redirect agar tidak terblokir oleh browser seluler
        await signInWithRedirect(auth, provider);
        return;
      }

      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        const profile = await financeService.getUserProfile(user.uid);
        if (!profile) {
          await financeService.saveUserProfile(
            user.uid,
            user.displayName || "Pengguna Google",
            user.email || "",
            100000
          );
        }
        onAuthSuccess(user.uid);
      } catch (popupErr: any) {
        console.warn("Popup blocked or failed, falling back to redirect:", popupErr);
        // Jika popup diblokir atau gagal, fallback otomatis ke Redirect
        if (popupErr.code === "auth/popup-blocked" || popupErr.code === "auth/popup-closed-by-user") {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupErr;
        }
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setError(err.message || "Gagal masuk menggunakan Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem("myfinn_demo_active_user", "true");
      localStorage.setItem("myfinn_onboarding_completed", "true");
      
      const existing = localStorage.getItem("myfinn_demo_profile");
      if (!existing) {
        const defaultProfile = {
          uid: "demo_user",
          name: "Pengguna Demo",
          email: "demo@myfinn.com",
          balance: 15000000,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem("myfinn_demo_profile", JSON.stringify(defaultProfile));
      }
      
      onAuthSuccess("demo_user");
    } catch (err) {
      console.error(err);
      setError("Gagal masuk dengan Mode Demo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Harap isi alamat email dan kata sandi Anda.");
      return;
    }

    // Intersepsi akun demo agar bisa login dengan mengetik demo@myfinn.com
    if (email.trim().toLowerCase() === "demo@myfinn.com") {
      handleDemoSignIn();
      return;
    }

    if (isRegister && !name) {
      setError("Harap masukkan nama lengkap Anda.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        // Proses Pendaftaran Akun Baru
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Simpan data profil pengguna ke Firestore dengan saldo awal
        await financeService.saveUserProfile(user.uid, name, email, initialBalance);
        onAuthSuccess(user.uid);
      } else {
        // Proses Masuk Akun Lama
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onAuthSuccess(userCredential.user.uid);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(getIndonesianErrorMessage(err.code || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center py-10 px-6">
      <main className="w-full max-w-md flex flex-col h-full relative">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mt-6 mb-8 text-center">
          <div className="w-20 h-20 mb-4 rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-200/50 bg-indigo-50 flex items-center justify-center">
            {/* Elegant App Logo */}
            <div className="w-14 h-14 bg-brand-gradient rounded-xl flex items-center justify-center text-white shadow-md">
              <span className="text-3xl font-bold font-sans tracking-tighter">F</span>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">MyFinn</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isRegister ? "Mulai langkah cerdas atur uangmu" : "Empowering your financial journey"}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-start gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 ml-1" htmlFor="name">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 ml-1" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
                  placeholder="Masukkan email Anda"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 ml-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
                  placeholder={isRegister ? "Buat password Anda (min 6 karakter)" : "Masukkan password Anda"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 ml-1" htmlFor="initialBalance">
                  Saldo Awal Tambahan (Rp)
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="initialBalance"
                    type="number"
                    min="0"
                    required
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors h-[48px]"
                    placeholder="Contoh: 100000"
                  />
                </div>
              </div>
            )}

            {!isRegister && (
              <div className="flex justify-end mt-1 mb-2">
                <button
                  type="button"
                  onClick={() => setError("Fitur reset password belum diaktifkan.")}
                  className="text-xs font-medium text-primary hover:text-indigo-700 transition-colors"
                >
                  Lupa password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] rounded-xl bg-brand-gradient text-white font-semibold text-base flex items-center justify-center shadow-md shadow-indigo-200 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 font-sans"
            >
              {loading ? "Menghubungkan..." : isRegister ? "Daftar" : "Masuk"}
            </button>

            <div className="relative my-1 flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atau</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-[52px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 shadow-sm hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 font-sans"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.58 15.02 1 12 1 7.35 1 3.39 3.67 1.41 7.59l3.85 2.99C6.18 7.31 8.87 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.26 14.12c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.41 7.59C.51 9.38 0 11.38 0 13.5s.51 4.12 1.41 5.91l3.85-2.99z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.13 0-5.82-2.27-6.77-5.54l-3.85 2.99C3.39 20.33 7.35 23 12 23z"
                />
              </svg>
              {isRegister ? "Daftar dengan Google" : "Masuk dengan Google"}
            </button>

            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full h-[52px] rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:border-slate-300 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 font-sans"
            >
              <Play className="w-4 h-4 text-primary fill-primary" />
              <span>Coba Demo Instan (Bebas Setup)</span>
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center pb-6">
          <p className="text-sm text-slate-500 font-medium">
            {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
              }}
              className="font-bold text-primary hover:text-indigo-700 transition-colors hover:underline focus:outline-none ml-1 cursor-pointer"
            >
              {isRegister ? "Masuk" : "Daftar"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
