import { SignIn } from "@clerk/nextjs";

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
            baseTheme: "dark",
            layout: {
              logoPlacement: "none",
              socialButtonsPlacement: "bottom",
              socialButtonsVariant: "iconButton",
              showOptionalFields: false
            },
            variables: {
              colorPrimary: "#06b6d4",
              colorBackground: "#0a0a0a",
              colorInputBackground: "#111",
              colorInputText: "#f1f5f9",
              colorText: "#f1f5f9",
              fontFamily: "Inter, sans-serif"
            },
            elements: {
              card: "border border-white/10 shadow-xl",
              headerTitle: "text-xl font-bold",
              headerSubtitle: "text-slate-400",
              formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 border-none shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all",
              formFieldInput: "border-white/10 focus:border-cyan-500/50 bg-slate-900/50",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500"
            }
          }}
        />
      </div>
    </div>
  );
}
