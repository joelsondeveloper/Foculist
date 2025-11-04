"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import ButtonFull from "@/components/ui/ButtonFull";
import Link from "next/link";
import Divider from "@/components/ui/Divider";

import { ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { signIn } from "next-auth/react";

const RegisterPage = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || "Ocorreu um erro ao registrar o usuário");
      }

      //messagem de sucesso

    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex justify-center items-center">
      <form className="bg-primary-foreground/8 rounded-2xl p-12 flex flex-col gap-8" onSubmit={handleSubmit}>
        <header className="flex flex-col gap-2 items-center">
          <h2 className="font-bold text-3xl">Crie sua conta</h2>
          <p>Junte-se ao Focuslist e assuma o controle de sua produtividade</p>
        </header>
        <div className="fields flex flex-col gap-5">
          <FormField
            label="Nome Completo"
            type="text"
            placeholder="Digite seu nome completo..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormField
            label="Email"
            type="email"
            placeholder="Digite seu email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            label="Senha"
            type="password"
            placeholder="Digite sua senha..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormField
            label="Confirmar Senha"
            type="password"
            placeholder="Confirme sua senha..."
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
        <div className="action flex flex-col gap-5">
          <ButtonFull color="bg-success" type="submit" disabled={loading}>
            <span className="font-semibold">{loading ? "Criando..." : "Criar conta"}</span>
            {loading ? null : <ArrowRight className="w-5 aspect-square" />}
          </ButtonFull>
          <div className="secondaryActions flex flex-col gap-3 text-center">
            <p className="text-sm">
              Já possui uma conta?{" "}
              <Link href="/login" className="font-medium text-info">
                Log In
              </Link>
            </p>
            <Divider />
            <ButtonFull
              color="bg-primary-foreground/8 border border-muted-foreground"
              type="button"
              disabled={loading}
              onClick={() => signIn("google", { callbackUrl: "/" })}
            >
              <FcGoogle className="w-5 aspect-square " />
              <span>Continue com o Google</span>
            </ButtonFull>
          </div>
        </div>
       <footer className="flex flex-col gap-2 text-center">
          <p className="text-xs"> criando uma conta, você concorda com nossos</p>
          <div className="terms text-xs">
            <Link href="/" className="font-medium text-info">
              Termos de uso
            </Link>
            <span> e </span>
            <Link href="/" className="font-medium text-info">
              Políticas de privacidade
            </Link>
          </div>
        </footer>
      </form>
    </section>
  );
};

export default RegisterPage;
