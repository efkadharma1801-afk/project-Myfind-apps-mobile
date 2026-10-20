import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { ArrowLeft, User, Mail, LogOut, ShieldAlert, Check, Edit2, Calendar, Users, Database } from "lucide-react";
import { auth, db } from "../firebase";
import { UserProfile } from "../types";
import { doc, updateDoc } from "firebase/firestore";
import { financeService } from "../services/financeService";

interface ProfileProps {
  userProfile: UserProfile;
  onBack: () => void;
  onUpdateName: (newName: string) => void;
}

export default function Profile({ userProfile, onBack, onUpdateName }: ProfileProps) {
  const [name, setName] = useState<string>(userProfile.name);
  const [editing, setEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // State untuk Daftar Pengguna Terdaftar
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState<boolean>(false);
  const [showUsers, setShowUsers] = useState<boolean>(false);

  // Ambil data semua pengguna dari Firestore
  useEffect(() => {
    if (showUsers) {
      const fetchUsers = async () => {
        setFetchingUsers(true);
        try {
          const list = await financeService.getAllUsers();
          setUsersList(list);
        } catch (error) {
          console.error("Gagal memuat daftar pengguna:", error);
        } finally {
          setFetchingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [showUsers]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem("myfinn_demo_active_user");
      if (userProfile.uid === "demo_user") {
        window.location.reload();
      } else {
        await signOut(auth);
      }
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setMessage(null);

    try {
      if (userProfile.uid === "demo_user") {
        const updatedProfile = { ...userProfile, name: name.trim() };
        localStorage.setItem("myfinn_demo_profile", JSON.stringify(updatedProfile));
        onUpdateName(name.trim());
      } else {
        const userRef = doc(db, "users", userProfile.uid);
        await updateDoc(userRef, { name: name.trim() });
        onUpdateName(name.trim());
      }
      setEditing(false);
      setMessage("Nama profil berhasil diperbarui!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error("Error updating profile name:", err);
      setMessage("Gagal memperbarui nama. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const formatJoinedDate = (dateIso: string) => {
    try {
      const date = new Date(dateIso);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return "-";
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
        <h2 className="text-xl font-bold text-slate-800">Profil Saya</h2>
      </div>

      <main className="w-full max-w-md mx-auto px-6 space-y-6">
        {/* User Avatar & Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center mb-4 text-primary font-bold text-3xl">
            {userProfile.name.charAt(0).toUpperCase()}
          </div>

          {editing ? (
            <div className="flex items-center gap-2 w-full max-w-xs justify-center mb-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary flex-grow h-[40px]"
              />
              <button
                onClick={handleSaveName}
                disabled={loading}
                className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-colors cursor-pointer"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center mb-1">
              <h3 className="text-lg font-bold text-slate-800">{userProfile.name}</h3>
              <button
                onClick={() => setEditing(true)}
                className="text-slate-400 hover:text-primary transition-colors p-1"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" />
            <span>{userProfile.email}</span>
          </p>

          {message && (
            <div className="mt-4 bg-indigo-50 text-primary text-xs font-semibold px-3 py-2 rounded-lg animate-fadeIn border border-indigo-100">
              {message}
            </div>
          )}
        </div>

        {/* Account Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Informasi Akun</h4>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-600">Nama Lengkap</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{userProfile.name}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-600">Alamat Email</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{userProfile.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
                <Calendar className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium text-slate-600">Bergabung Sejak</span>
            </div>
            <span className="text-sm font-bold text-slate-800">{formatJoinedDate(userProfile.createdAt)}</span>
          </div>
        </div>

        {/* Security & System Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-0.5">Keamanan & Arsitektur Backend</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Aplikasi ini menggunakan arsitektur <strong>Client-to-Cloud</strong> modern berbasis <strong>Firebase (Firestore Database & Authentication)</strong>. Seluruh data transaksi dan profil disinkronkan secara aman.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  <span>Lokasi Konfigurasi & Data</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Kredensial database tersimpan di file <code className="bg-slate-200/60 px-1 py-0.5 rounded text-[10px] font-mono">firebase-applet-config.json</code>. Data disimpan di database cluster regional Cloud Run / Firestore Anda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Users List (Siapa Saja Yang Sudah Daftar) */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-primary">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Daftar Pengguna Terdaftar</h4>
            </div>
            <button
              onClick={() => setShowUsers(!showUsers)}
              className="text-xs font-bold text-primary hover:underline cursor-pointer bg-indigo-50 hover:bg-indigo-100/50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showUsers ? "Sembunyikan" : "Lihat Semua"}
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Berikut adalah daftar seluruh pengguna yang telah melakukan registrasi ke aplikasi MyFinn ini (diambil langsung dari database Firestore).
          </p>

          {showUsers && (
            <div className="space-y-3 pt-2 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
              {fetchingUsers ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-400 font-medium">Memuat data dari Firestore...</span>
                </div>
              ) : usersList.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada pengguna terdaftar.</p>
              ) : (
                usersList.map((u) => (
                  <div key={u.uid} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-primary font-bold text-sm flex items-center justify-center">
                        {u.name ? u.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          {u.name}
                          {u.uid === userProfile.uid && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[8px]">
                              Anda
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{u.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-primary block">
                        Rp {u.balance?.toLocaleString("id-ID") || 0}
                      </span>
                      <span className="text-[9px] text-slate-400 font-medium block">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Logout Action */}
        <button
          onClick={handleLogout}
          className="w-full h-[52px] rounded-xl border border-red-200 bg-red-50 hover:bg-red-100/50 text-red-700 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun (Logout)</span>
        </button>
      </main>
    </div>
  );
}
