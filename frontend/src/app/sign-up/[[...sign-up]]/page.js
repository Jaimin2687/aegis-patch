import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-[#05070c] text-white flex flex-col items-center justify-center relative overflow-hidden font-sans py-12 px-4">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Cyber Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#05070c] via-transparent to-[#05070c] pointer-events-none" />

      {/* Top Left Return Link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="px-4 py-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-md backdrop-blur-md"
        >
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="relative z-10 mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-semibold shadow-sm mb-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>REGISTRATION // OPERATOR REGISTRY</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-cyan-300">
          AEGIS-PATCH
        </h1>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Create an account to manage automated vulnerability pipelines
        </p>
      </div>

      {/* Styled Clerk Sign-Up Form Container */}
      <div className="relative z-10 w-full max-w-md shadow-[0_0_80px_rgba(6,182,212,0.18)] rounded-3xl p-1 bg-gradient-to-b from-cyan-500/30 via-indigo-500/10 to-transparent">
        <div className="bg-[#0b0d14]/90 backdrop-blur-2xl border border-white/10 rounded-[22px] p-2">
          <SignUp
            appearance={{
              baseTheme: dark,
              layout: {
                logoPlacement: "none",
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
                showOptionalFields: false,
              },
              variables: {
                colorPrimary: "#00f2fe",
                colorBackground: "#0b0d14",
                colorInputBackground: "#05070c",
                colorInputText: "#f8fafc",
                colorText: "#f8fafc",
                colorTextSecondary: "#94a3b8",
                colorNeutral: "#cbd5e1",
                fontFamily: "Inter, system-ui, sans-serif",
                borderRadius: "0.875rem",
              },
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-none shadow-none p-4",
                headerTitle: "text-xl font-bold text-white text-center",
                headerSubtitle: "text-slate-400 text-center text-xs",
                formButtonPrimary:
                  "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-black font-bold tracking-wide border-none shadow-[0_0_20px_rgba(0,242,254,0.3)] transition-all duration-300 py-3 text-sm rounded-xl",
                formFieldInput:
                  "bg-[#05070c] border border-white/15 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 rounded-xl text-sm py-2.5 px-3.5",
                formFieldLabel: "text-slate-300 font-medium text-xs mb-1",
                socialButtonsBlockButton:
                  "bg-[#111420] border border-white/15 text-white hover:bg-slate-800 hover:border-cyan-500/40 transition-all rounded-xl py-2.5",
                socialButtonsBlockButtonText: "text-slate-200 font-semibold text-xs",
                dividerLine: "bg-white/10",
                dividerText: "text-slate-500 text-xs font-mono uppercase",
                identityPreviewEditButton: "text-cyan-400 hover:text-cyan-300 font-semibold text-xs",
                formResendCodeLink: "text-cyan-400 hover:text-cyan-300 font-semibold text-xs",
                footerAction: "text-slate-400 text-xs",
                footerActionLink: "text-cyan-400 hover:text-cyan-300 font-semibold text-xs underline",
                badge: "hidden",
                logoBox: "hidden",
              },
            }}
          />
        </div>
      </div>

      {/* Footer Disclaimer */}
      <p className="relative z-10 mt-8 text-xs text-slate-500 font-mono tracking-wider">
        PROTECTED BY AEGIS CRYPTOGRAPHIC GUARDIAN v1.0.0
      </p>
    </div>
  );
}
