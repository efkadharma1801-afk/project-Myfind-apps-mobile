import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Wallet, TrendingDown, Eye, TrendingUp, PieChart } from "lucide-react";
import { ScreenType } from "../types";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const nextStep = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as any);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const images = {
    1: "https://lh3.googleusercontent.com/aida-public/AB6AXuAC2RMgWdxb7cwt7G3B6_tnRgbSOFvo8t4le318uNG52AxUzgGc0GVTnpk1cs70W_fM1Nlgop7jvolOn51EDZYPjYjpYb2myiPzk2u8Qtj_0csJFD9_xQgIFOcX5Jc_CLnHahgupuevd8Iznj5AitbKV4gyhLTWl2VRbXzyEWMypNeRJyvTjCklX8Gs-j-6aX8qxXUrWPc6wMo8h-a5NIGguEAA0IoGteOBcJQsM0BtMdiMR0YVilvbmXsLMKYf2tTtE7f_7diDPah6",
    2: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkXsL2IXD9anNv-BaT7a8lTRd0G1wzQ7mTU8JZKA_UejoAX1DHq5l2Gk12V_hqDHcgSOUASl6_3GhyNj3M6ZbdAi8b7sKKW4Rm6BgUuW6g_XD-8IwTuKaVKzgyIYXYhmIRKlcsnv_68s69YZb8UKgOyvGPBOibQlokhBmJXAlc6W2Cvewxnj-4GPOi_qPUYLerTTp69vKqSdBSCd7agn6WKM6PRlHK4vJFCWTEumGqsQgiWUGkVNhvsJQTPlB_yc4r--ZTloBMLoWy",
    3: "https://lh3.googleusercontent.com/aida-public/AB6AXuBo9RkY-6eueCoaGXaZ3Y6of4nNjvvGJS5P7Yqd82nthPK4kxC4I0XlT6FrbI1QafVAWQ6fTYXKO_c-toT_h6b1tlPfpWsXPQX96tLATTtH-o92VM9pSLIRDReXVeuOEBi_9WL1ILYeCPl3cGmAO388Bo_oZIH1pc4PIU6-3Gzaa0RmCzfD6nvmqf9_yz9n5KpCxbf1LJVn63AvH1sYnPRrzxbiG3goDMNT7eSA6FhHTe0a6xSe7AKO6aBvBwupJKI84q7NdP-IycBw"
  };

  const titles = {
    1: "Catat Keuangan dengan Mudah",
    2: "Kontrol Budget Kamu",
    3: "Pantau Laporan Keuangan"
  };

  const descriptions = {
    1: "Catat pemasukan dan pengeluaran kapan saja.",
    2: "Atur batas pengeluaran agar keuangan tetap aman.",
    3: "Lihat ringkasan dan pola pengeluaranmu."
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between overflow-hidden relative pb-12 pt-6">
      {/* Ambient background blur elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-100 blur-3xl opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-indigo-100 blur-3xl opacity-50"></div>
      </div>

      {/* Header Skip button */}
      <div className="w-full flex justify-between items-center px-6 pt-4 z-10 shrink-0">
        <div className="font-bold text-2xl text-primary font-sans tracking-tight">MyFinn</div>
        <button
          onClick={skipOnboarding}
          className="font-medium text-sm text-slate-500 hover:text-primary transition-colors py-2 px-4 rounded-full glass-card cursor-pointer"
        >
          Lewati
        </button>
      </div>

      {/* Main Content Carousel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-4 z-10 relative max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="w-full flex flex-col items-center"
          >
            {/* Image Container with float animation and elements */}
            <div className="w-full aspect-square mb-8 relative flex items-center justify-center">
              <div className="absolute inset-4 rounded-full border border-dashed border-indigo-200 animate-[spin_60s_linear_infinite]"></div>
              <div className="absolute inset-12 rounded-full border border-blue-100/50 animate-[spin_40s_linear_infinite_reverse]"></div>

              {/* Step specific decorative badges */}
              {step === 2 && (
                <>
                  <div className="absolute top-[10%] right-[2%] bg-white rounded-xl p-3 shadow-lg border border-slate-100 animate-pulse z-20">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute bottom-[20%] left-[2%] bg-white rounded-full p-2.5 shadow-md border border-slate-100 animate-bounce z-20" style={{ animationDuration: '3s' }}>
                    <TrendingDown className="w-5 h-5 text-blue-600" />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="absolute top-[8%] right-[8%] bg-white rounded-xl p-2.5 shadow-lg z-20 border border-slate-100">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="absolute bottom-[15%] left-[8%] bg-white rounded-xl p-2.5 shadow-lg z-20 border border-slate-100">
                    <PieChart className="w-5 h-5 text-primary" />
                  </div>
                </>
              )}

              {/* Main Illustration */}
              <img
                src={images[step]}
                alt={titles[step]}
                className="w-[85%] h-[85%] object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Typography Content */}
            <div className="w-full text-center">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gradient tracking-tight leading-tight px-2">
                {titles[step]}
              </h1>
              <p className="text-base text-slate-500 max-w-[280px] mx-auto font-normal leading-relaxed">
                {descriptions[step]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation and Action Canvas */}
      <div className="w-full px-6 pt-4 shrink-0 z-10 relative max-w-md mx-auto">
        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div
            onClick={() => setStep(1)}
            className={`cursor-pointer rounded-full h-2 transition-all duration-300 ${
              step === 1 ? "w-8 bg-primary" : "w-2 bg-indigo-200"
            }`}
          ></div>
          <div
            onClick={() => setStep(2)}
            className={`cursor-pointer rounded-full h-2 transition-all duration-300 ${
              step === 2 ? "w-8 bg-primary" : "w-2 bg-indigo-200"
            }`}
          ></div>
          <div
            onClick={() => setStep(3)}
            className={`cursor-pointer rounded-full h-2 transition-all duration-300 ${
              step === 3 ? "w-8 bg-primary" : "w-2 bg-indigo-200"
            }`}
          ></div>
        </div>

        {/* Primary action button */}
        <button
          onClick={nextStep}
          className="w-full h-[56px] rounded-xl bg-brand-gradient text-white font-semibold text-lg shadow-[0px_8px_20px_rgba(70,72,212,0.25)] hover:shadow-[0px_12px_25px_rgba(70,72,212,0.35)] active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
        >
          {step === 3 ? "Mulai Sekarang" : "Lanjut"}
          {step < 3 && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>
    </div>
  );
}
