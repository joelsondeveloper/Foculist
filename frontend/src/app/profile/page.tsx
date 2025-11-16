"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import ButtonGeneral from "@/components/ui/ButtonGeneral";

import { Pencil, Lock, Info, CheckCircle2, Crown, AlertTriangle, Trash2 } from "lucide-react";
import ButtonFull from "@/components/ui/ButtonFull";
import { signOut } from "next-auth/react";
import { useMessages } from "../context/MessageContext";
import NotificationSettings from "@/components/ui/NotificationSettings";

const freePlanFeatures = [
  "Criação de tarefas ilimitadas",
  "Até 4 categorias customizáveis",
  "Acesso via Web",
];

const premiumPlanFeatures = [
  "Todos os benefícios do plano gratuito, e mais:",
  "Experiência livre de anúncios",
  "Categorias customizáveis ilimitadas",
  "Relatórios de produtividade (em breve)",
  "Temas e customização avançada (em breve)",
];

const ProfilePage = () => {
  const { data: session } = useSession();
  const user = session?.user;
  const userInitials = user?.name ? user.name.charAt(0).toUpperCase() : "?";
  const isPremium = user?.plan === "premium";

  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { addMessage } = useMessages();

  useEffect(() => {
    if (!provider) {
      const fetchAccountDetails = async () => {
        try {
          const res = await fetch("/api/user/account-details");
          if (!res.ok) throw new Error("Erro na resposta da API");
          const data = await res.json();
          if (data.success) {
            setProvider(data.data.provider);
          }
        } catch (error) {
          console.error("Falha ao buscar dados do usuário", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAccountDetails();
    }
  }, []);

  const handleUpgradeClick = async () => {
    setIsRedirecting(true);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao criar sessão de checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      alert((error as Error).message);
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      addMessage("Usuário não logado para deletar conta.", "error");
      return;
    }

    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados (tarefas, categorias, etc.) serão permanentemente removidos."
    )

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/user`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        addMessage(data.message || "Erro ao deletar conta", "error");
        throw new Error(data.message || "Erro ao deletar conta");
      }

      addMessage(data.message || "Conta deletada com sucesso!", "success");
      await signOut({ callbackUrl: "/login" });
    } catch (error) {
      console.error("Erro ao deletar conta:", error);
      addMessage("Erro ao deletar conta", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <p>Carregando perfil...</p>;
  }

  if (!session) {
    return null;
  }

  return (
    <section className="p-10 flex justify-center">
      <div className="profileContainer bg-primary-foreground/4 p-12 rounded-2xl flex flex-col gap-8">
        <h2 className=" font-bold text-3xl">Meu Perfil</h2>
        <div className="profileCard p-8 flex bg-primary-foreground/4 rounded-2xl gap-4">
          <div className="avatar w-30 aspect-square relative">
            {user?.image ? (
              <Image
                src={user.image}
                alt="Avatar"
                fill
                className="rounded-full aspect-square object-cover"
              />
            ) : (
              <p className="font-bold text-4xl">{userInitials}</p>
            )}
          </div>
          <div className="info flex flex-col gap-4">
            <div className="details flex flex-col gap-2">
              <h3 className="font-semibold text-2xl ">{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
            <ButtonGeneral color="bg-primary-foreground/8">
              <div className="container flex items-center gap-2">
                <Pencil size="1rem" /> <span>Editar Perfil</span>
              </div>
            </ButtonGeneral>
          </div>
        </div>
        {provider && (
          <div className="securityCard p-8 flex flex-col bg-primary-foreground/4 rounded-2xl gap-5">
            <h3 className="font-semibold text-xl">Segurança</h3>
            <p className="text-sm">
              Gerencie o acesso e segurança da sua conta.
            </p>

            {provider === "credentials" && (
              <ButtonGeneral color="bg-primary-foreground/8">
                <div className="container flex items-center gap-2">
                  <Lock size="1rem" /> <span>Editar Senha</span>
                </div>
              </ButtonGeneral>
            )}


            <div className="note flex flex-col gap-2 rounded-2xl bg-warning/13 p-4 border border-warning">
              <header className="flex gap-2 items-center text-warning">
                <Info size="1rem" />
                <p className="font-semibold text-sm">Nota</p>
              </header>
              <p className="text-sm">
                {provider === "credentials"
                  ? "Essa seção só está disponível para contas com e-mail e senha. Se você usa login social, gerencie sua senha direto no seu provedor."
                  : "Sua conta está conectada pelo Google. Para mudar sua senha, acesse as configurações da sua conta Google."}
              </p>
            </div>
          </div>
        )}
        
        <NotificationSettings />

        <div className="subscriptionCard p-8 flex flex-col bg-primary-foreground/4 rounded-2xl gap-5">
          <h3 className="font-semibold text-2xl">Assinatura</h3>
          <div className="details flex flex-col gap-3">
            <div className="current flex justify-between">
              <p className="text-sm">Assinatura Atual</p>
              <div
                className={`badge px-3 py-1.5 rounded-xl ${
                  isPremium ? "bg-green-500/20 text-green-400" : "bg-primary"
                }`}
              >
                <p className="text-xs font-medium">
                  {isPremium ? "Premium" : "Gratuito"}
                </p>
              </div>
            </div>
            <div className="description flex flex-col gap-2">
              <p className="text-sm">
                {isPremium
                  ? "Você tem acesso a todos os recursos do Focuslist. Obrigado pelo seu apoio!"
                  : "No momento, você está em nosso plano gratuito com recursos básicos de gerenciamento de tarefas."}
              </p>
              <ul className="flex flex-col gap-1">
                {(isPremium ? premiumPlanFeatures : freePlanFeatures).map(
                  (feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle2
                        size="1rem"
                        className={
                          isPremium ? "text-green-400" : "text-muted-foreground"
                        }
                      />
                      <span className="text-sm">{feature}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
          <ButtonFull
            color="bg-success"
            onClick={handleUpgradeClick}
            disabled={isRedirecting}
          >
            {isRedirecting ? "redirecionando..." : (
                <div className="container flex items-center gap-2 justify-center">
                    <Crown size="1rem" /> <span>Assinar Premium</span>
                </div>
            )}
          </ButtonFull>
        </div>
        <div className="dangerZone p-8 flex flex-col bg-primary-foreground/4 rounded-2xl gap-5 border border-destructive">
            <header className="flex flex-col gap-2">
                <div className="title flex items-center gap-2 text-destructive">
                    <AlertTriangle size="1.25rem" />
                    <h3 className="font-semibold text-2xl">Zona Perigosa</h3>
                </div>
                <p className="text-sm">Ações irreversíveis que afetarão permanentemente sua conta.</p>
            </header>
            <div className="delete bg-destructive/9 flex flex-col gap-3 p-5 rounded-2xl border border-destructive">
                <h4 className="font-semibold">Excluir Conta</h4>
                <p className="text-sm">Depois de excluir sua conta, não há como voltar atrás. Todas as suas tarefas, categorias e dados serão removidos permanentemente.</p>
                <ButtonGeneral color="bg-destructive/8 border border-destructive" onClick={handleDeleteAccount}>
                    <div className="container flex items-center gap-2 text-destructive text-sm font-semibold">
                        <Trash2 size="1rem" /> <span>Excluir Conta</span>
                    </div>
                </ButtonGeneral>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
