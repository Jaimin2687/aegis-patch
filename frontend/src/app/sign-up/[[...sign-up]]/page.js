import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden">


      <div className="w-full max-w-md mx-auto z-10 p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            AEGIS-PATCH
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium tracking-wide">
            AUTONOMOUS SECURITY PIPELINE
          </p>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <SignUp />
        </div>

        <div className="mt-8 text-center text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
