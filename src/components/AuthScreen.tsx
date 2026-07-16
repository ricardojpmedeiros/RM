import React, { useState, useEffect } from "react";
import { Compass, Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { authService } from "../services/authService";
import { invitationService } from "../services/invitationService";

interface AuthScreenProps {
  onAuthSuccess: () => void;
  initialInviteToken?: string;
}

export default function AuthScreen({ onAuthSuccess, initialInviteToken }: AuthScreenProps) {
  const [view, setView] = useState<"login" | "register" | "recover" | "reset" | "accept-invite">("login");
  
  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Invitation fields
  const [inviteToken, setInviteToken] = useState(initialInviteToken || "");
  const [inviteTripTitle, setInviteTripTitle] = useState("");
  const [inviteSenderName, setInviteSenderName] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(false);

  // General state
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Check URL hash/parameters on mount
  useEffect(() => {
    // 1. Detect invite token in query string or URL path
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setInviteToken(tokenParam);
      setView("accept-invite");
      loadInviteDetails(tokenParam);
    }

    // 2. Detect password recovery hash
    const hash = window.location.hash;
    if (hash && (hash.includes("type=recovery") || hash.includes("access_token="))) {
      setView("reset");
    }
  }, []);

  // Fetch invitation details safely
  const loadInviteDetails = async (token: string) => {
    setLoadingInvite(true);
    try {
      const details = await invitationService.fetchInvitationByToken(token);
      if (details) {
        setInviteTripTitle(details.trips?.title || "Viagem Partilhada");
        // We can get inviter profile name
        const inviterProfile = await authService.getProfile(details.invited_by);
        setInviteSenderName(inviterProfile?.full_name || "Organizador");
      } else {
        setError("O convite de partilha já não é válido ou expirou.");
      }
    } catch (err: any) {
      setError("Falha ao analisar os dados do convite.");
    } finally {
      setLoadingInvite(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.login(email.trim(), password);
      setSuccessMsg("Sessão iniciada com sucesso!");
      
      // If we came from an invitation, let them accept
      if (inviteToken) {
        setView("accept-invite");
        loadInviteDetails(inviteToken);
      } else {
        setTimeout(() => onAuthSuccess(), 800);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao iniciar sessão.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.register(email.trim(), password, fullName.trim());
      setSuccessMsg("Conta criada! Por favor, verifique o seu e-mail para confirmar o registo.");
      // Auto redirect to login after a delay
      setTimeout(() => setView("login"), 4000);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const currentUrl = window.location.origin + window.location.pathname;
      await authService.recoverPassword(email.trim(), currentUrl);
      setSuccessMsg("Instruções de recuperação enviadas para o seu e-mail.");
    } catch (err: any) {
      setError(err.message || "Erro ao recuperar palavra-passe.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.updatePassword(newPassword);
      setSuccessMsg("A sua palavra-passe foi atualizada com sucesso!");
      setTimeout(() => {
        setView("login");
        // Clear recovery hash in browser URL
        window.history.replaceState(null, "", window.location.pathname);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar palavra-passe.");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        setView("login");
        setError("Inicie sessão para aceitar o convite.");
        return;
      }

      await invitationService.acceptInvitation(inviteToken);
      setSuccessMsg("Convite aceite! A viagem foi adicionada à sua conta.");
      // Clear token query parameter from URL
      window.history.replaceState(null, "", window.location.pathname);
      setTimeout(() => onAuthSuccess(), 2000);
    } catch (err: any) {
      setError(err.message || "Erro ao aceitar convite.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12" id="auth-root">
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-xl max-w-md w-full space-y-6">
        
        {/* Title / Logo */}
        <div className="text-center space-y-3">
          <div className="bg-indigo-600 text-white p-3.5 rounded-2xl shadow-lg shadow-indigo-100 inline-block">
            <Compass className="w-8 h-8 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">TripPilot Pro</h1>
          <p className="text-gray-500 text-xs">
            {view === "login" && "Organize e partilhe as suas viagens na nuvem de forma segura."}
            {view === "register" && "Crie o seu perfil cloud de planeador principal."}
            {view === "recover" && "Recupere o acesso à sua conta e planeamentos."}
            {view === "reset" && "Defina a sua nova palavra-passe de acesso."}
            {view === "accept-invite" && "Convite de Viagem Recebido ✉️"}
          </p>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 flex gap-2 items-start">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-100 flex gap-2 items-start">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* --- VIEW: LOGIN --- */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Endereço de E-mail *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email" required placeholder="ricardo@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-gray-700 font-bold">Palavra-passe *</label>
                <button
                  type="button" onClick={() => setView("recover")}
                  className="text-[10px] text-indigo-600 font-bold hover:underline"
                >
                  Esqueceu-se?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password" required placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar Sessão"}
            </button>



            <div className="text-center pt-2">
              <p className="text-gray-500">
                Ainda não tem conta?{" "}
                <button
                  type="button" onClick={() => setView("register")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Registe-se aqui
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- VIEW: REGISTER --- */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Nome Completo *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text" required placeholder="Ex: Ricardo Medeiros"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Endereço de E-mail *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email" required placeholder="ricardo@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Palavra-passe (mín. 6 caracteres) *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password" required placeholder="Crie uma palavra-passe segura"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Conta Cloud"}
            </button>



            <div className="text-center pt-2">
              <p className="text-gray-500">
                Já tem conta?{" "}
                <button
                  type="button" onClick={() => setView("login")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Iniciar Sessão
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- VIEW: RECOVER --- */}
        {view === "recover" && (
          <form onSubmit={handleRecovery} className="space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Endereço de E-mail *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email" required placeholder="Insira o seu e-mail de registo"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Link de Recuperação"}
            </button>

            <button
              type="button" onClick={() => setView("login")}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
            </button>
          </form>
        )}

        {/* --- VIEW: RESET --- */}
        {view === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs text-left">
            <div className="space-y-1">
              <label className="block text-gray-700 font-bold">Nova Palavra-passe *</label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password" required placeholder="Mínimo 6 caracteres"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-indigo-600 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Definir Nova Palavra-passe"}
            </button>
          </form>
        )}

        {/* --- VIEW: ACCEPT INVITE --- */}
        {view === "accept-invite" && (
          <div className="space-y-5 text-xs text-left">
            {loadingInvite ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <p className="text-gray-400 font-semibold text-[10px]">A ler dados do convite...</p>
              </div>
            ) : inviteTripTitle ? (
              <div className="space-y-4">
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-2">
                  <p className="font-semibold text-indigo-900 leading-relaxed">
                    Olá! <strong>{inviteSenderName}</strong> convidou-o para participar como <strong>Consultor (Leitura)</strong> na viagem:
                  </p>
                  <p className="text-base font-bold text-gray-800 bg-white border border-gray-100 px-3 py-2 rounded-xl text-center">
                    🗺️ {inviteTripTitle}
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleAcceptInvite} disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aceitar Convite e Aceder à Viagem"}
                  </button>

                  <button
                    onClick={() => {
                      setView("login");
                      window.history.replaceState(null, "", window.location.pathname);
                    }}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Recusar / Entrar noutro perfil
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-gray-500">Inicie sessão na sua conta ou crie uma conta para poder aceitar convites de viagem.</p>
                <button
                  onClick={() => setView("login")}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl transition-all"
                >
                  Iniciar Sessão
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
