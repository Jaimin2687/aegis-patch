import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function SignInPage() {
  return (
    <div className="min-h-screen w-full bg-[#000000] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Dot grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      {/* Radial fade for focus */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black" />
      
      {/* Brand highlight */}
      <div className="relative z-10 mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
          AEGIS-PATCH
        </h1>
        <p className="text-sm text-slate-500 mt-2">Secure access required</p>
      </div>

      <div className="relative z-10 shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-2xl">
        <SignIn
          appearance={{
            baseTheme: dark,
            layout: {
              logoPlacement: "none",
              socialButtonsPlacement: "top",
              socialButtonsVariant: "iconButton",
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: "#06b6d4",
              colorBackground: "#0a0a0a",
              colorInputBackground: "#111111",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              colorTextSecondary: "#94a3b8",
              colorNeutral: "#e2e8f0",
              fontFamily: "Inter, system-ui, sans-serif",
              borderRadius: "0.75rem",
            },
            elements: {
              rootBox: "w-full",
              card: "bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-2xl",
              headerTitle: "text-xl font-bold text-white",
              headerSubtitle: "text-slate-400",
              formButtonPrimary:
                "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 font-semibold",
              formFieldInput:
                "bg-[#111] border border-white/10 text-white focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 rounded-lg",
              formFieldLabel: "text-slate-300 font-medium",
              socialButtonsBlockButton:
                "bg-[#111] border border-white/10 text-white hover:bg-[#1a1a1a] hover:border-white/20 transition-all",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500",
              identityPreviewEditButton: "text-cyan-400 hover:text-cyan-300",
              formResendCodeLink: "text-cyan-400 hover:text-cyan-300",
              footerAction: "text-slate-400",
              footerActionLink: "text-cyan-400 hover:text-cyan-300",
              // Hide Clerk branding
              footer: "hidden",
              badge: "hidden",
              logoBox: "hidden",
              internal: "hidden",
            },
          }}
        />
      </div>

      {/* Bottom subtle text */}
      <p className="relative z-10 mt-8 text-xs text-slate-600">
        Autonomous Security Patching Engine
      </p>
    </div>
  );
}
