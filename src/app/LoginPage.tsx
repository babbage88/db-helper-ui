import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form";
import { useNavigate } from "react-router-dom";
import { AuthenticationService } from "@/lib/api";
import type { FormEvent } from "react";
import mascot from '@/assets/DbBobMaskot.sky.svg'

export default function LoginPage() {
  const navigate = useNavigate();

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email")?.toString() || "";
    const password = formData.get("password")?.toString() || "";

    try {
      console.log(`username ${email} login test`);
      const data = await AuthenticationService.localLogin({ username: email, password });

      const { accessToken, refreshToken, user_id } = data;

      if (!accessToken || !refreshToken) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", user_id ?? "");

      navigate("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err.message);
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            DbBob
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleLoginSubmit} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <img
          src={mascot}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
        />
      </div>
    </div>
  );
}
