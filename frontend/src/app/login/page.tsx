"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import FormField from "@/components/ui/FormField";
import ButtonFull from "@/components/ui/ButtonFull";
import Link from "next/link";
import Divider from "@/components/ui/Divider";

import { ArrowRight } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const RegisterPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      setNotice("E-mail confirmado. Você já pode entrar.");
    }
    if (params.has("error")) {
      setError("Não foi possível entrar com o Google. Tente novamente.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(
          res.error.includes("verifique seu e-mail")
            ? res.error
            : res.error === "CredentialsSignin"
              ? "E-mail ou senha inválidos."
              : "Não foi possível entrar no momento. Tente novamente."
        );
        return;
      } else if (res?.ok) {
        router.push("/");
      } else {
        setError("Não foi possível entrar no momento. Tente novamente.");
      }

    } catch {
      setError("Ocorreu um erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex justify-center items-center">
      <form className="bg-primary-foreground/8 rounded-2xl p-12 flex flex-col gap-8" onSubmit={handleSubmit}>
        <header className="flex flex-col gap-2 items-center">
          <h2 className="font-bold text-3xl">Logue em sua conta</h2>
          <p>Junte-se ao Focuslist e assuma o controle de sua produtividade</p>
        </header>
        <div className="fields flex flex-col gap-5">
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
        </div>
        {error && <p className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
        {notice && <p className="text-green-500 text-sm text-center bg-green-500/10 p-2 rounded-md">{notice}</p>}
        <div className="action flex flex-col gap-5">
          <ButtonFull color="bg-success" type="submit" disabled={loading}>
            <span className="font-semibold">{loading ? "Entrando..." : "Entrar"}</span>
            {loading ? (
              null
            ) : (
              <ArrowRight className="w-5 aspect-square" />
            )}
          </ButtonFull>
          <div className="secondaryActions flex flex-col gap-3 text-center">
            <p className="text-sm">
              {" "}
              Ainda não possui uma conta?
              <Link href="/register" className="font-medium text-info">
                Cadastre-se
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
          <p className="text-xs">By criando uma conta, você concorda com nossos</p>
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
