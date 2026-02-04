/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Gradiente */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FE3E6E] via-[#C24695] to-[#7151C9] items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8">
<img
              src="data:image/webp;base64,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"
              alt="Assistente Vi"
              width={180}
              height={180}
              className="mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold mb-4">Assistente Vi</h1>
          <p className="text-xl text-white/80">
            Sua assistente virtual inteligente para gestão de leads e atendimento
          </p>
        </div>
      </div>

      {/* Lado direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F8F7FA]">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden mb-8 text-center">
<img
              src="data:image/webp;base64,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"
              alt="Assistente Vi"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Bem-vindo de volta!
            </h2>
            <p className="text-gray-500 mb-8">
              Entre com suas credenciais para acessar o sistema
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-[#FE3E6E] to-[#C24695] hover:from-[#C24695] hover:to-[#7151C9] text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-400">
              Solicite acesso ao administrador do sistema
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FE3E6E]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
