"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import PasswordField from "@/components/PasswordField";
import type { Role, Token } from "@/lib/types";

type View = "signin" | "signup" | "checkEmail" | "setPassword";

export default function AuthGate() {
  const router = useRouter();
  const params = useSearchParams();
  const { ready, role, setSession } = useAuth();
  const showToast = useToast();

  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [checkEmailAddress, setCheckEmailAddress] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role>("studio");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && role) {
      router.replace(role === "admin" ? "/admin" : "/studio");
    }
  }, [ready, role, router]);

  useEffect(() => {
    const token = params.get("confirm");
    if (!token || confirming) return;
    setConfirming(true);
    (async () => {
      try {
        const auth = await api<Token>("/auth/confirm", { method: "POST", body: { token } });
        localStorage.setItem("lf_token", auth.access_token);
        localStorage.setItem("lf_role", auth.role);
        setPendingRole(auth.role);
        setView("setPassword");
        router.replace("/");
      } catch (err) {
        showToast(err instanceof ApiError ? err.message : "Confirmation link is invalid or expired");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const auth = await api<Token>("/auth/login", { method: "POST", body: { email, password } });
      await setSession(auth.access_token, auth.role);
      router.replace(auth.role === "admin" ? "/admin" : "/studio");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function doSignup(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/auth/signup", { method: "POST", body: { name: signupName, email: signupEmail } });
      setCheckEmailAddress(signupEmail);
      setView("checkEmail");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  async function doSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 6) {
      showToast("Password must be at least 6 characters");
      return;
    }
    if (newPass !== newPassConfirm) {
      showToast("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      await api("/auth/set-password", { method: "POST", body: { password: newPass } });
      await setSession(localStorage.getItem("lf_token") || "", pendingRole);
      router.replace(pendingRole === "admin" ? "/admin" : "/studio");
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not set password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-linesoft bg-[linear-gradient(160deg,#1b1712_0%,#14110e_70%)] p-14 lg:flex">
        <div className="font-display text-xl font-extrabold tracking-wide">
          LEAD<span className="text-gold">FLOW</span>
        </div>
        <div className="max-w-md">
          <div className="eyebrow">Studio Editing Portal</div>
          <h1 className="mt-4 font-display text-[42px] font-light leading-tight">
            Send your shoots, <em className="font-bold not-italic text-goldbright">track every edit.</em>
          </h1>
          <p className="mt-5 text-[15.5px] text-inkmid">
            Upload session files, follow progress stage by stage, and manage invoices with Elyon — all from one
            gateway.
          </p>
        </div>
        <div className="text-xs text-inkdim">Editing services by Elyon</div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          {view === "signin" && (
            <form onSubmit={doLogin}>
              <h2 className="font-display text-2xl font-bold">Sign in</h2>
              <p className="mt-1.5 mb-8 text-sm text-inkmid">Welcome back to your studio portal.</p>
              <div className="mb-5">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </div>
              <PasswordField id="loginPass" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
              <button type="submit" disabled={busy} className="btn btn-gold w-full">
                Sign in
              </button>
              <div className="mt-7 text-center text-[13px] text-inkdim">
                New studio?{" "}
                <button type="button" onClick={() => setView("signup")} className="font-semibold text-goldbright">
                  Create an account
                </button>
              </div>
            </form>
          )}

          {view === "signup" && (
            <form onSubmit={doSignup}>
              <h2 className="font-display text-2xl font-bold">Create your account</h2>
              <p className="mt-1.5 mb-8 text-sm text-inkmid">We&apos;ll email you a link to confirm and set a password.</p>
              <div className="mb-5">
                <label className="field-label">Studio name</label>
                <input
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  className="field-input"
                />
              </div>
              <div className="mb-5">
                <label className="field-label">Email</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="field-input"
                />
              </div>
              <button type="submit" disabled={busy} className="btn btn-gold w-full">
                Create account
              </button>
              <div className="mt-7 text-center text-[13px] text-inkdim">
                Already have an account?{" "}
                <button type="button" onClick={() => setView("signin")} className="font-semibold text-goldbright">
                  Sign in
                </button>
              </div>
            </form>
          )}

          {view === "checkEmail" && (
            <div>
              <h2 className="font-display text-2xl font-bold">Check your email</h2>
              <p className="mt-3 text-sm leading-relaxed text-inkmid">
                We sent a confirmation link to <b className="text-ink">{checkEmailAddress}</b>. Click it to verify
                your account and set a password.
              </p>
              <button type="button" onClick={() => setView("signin")} className="btn btn-ghost mt-7 w-full">
                Back to sign in
              </button>
            </div>
          )}

          {view === "setPassword" && (
            <form onSubmit={doSetPassword}>
              <div className="eyebrow mb-2">Email confirmed</div>
              <h2 className="font-display text-2xl font-bold">Set your password</h2>
              <p className="mt-1.5 mb-8 text-sm text-inkmid">Choose a password so you can sign in next time.</p>
              <PasswordField id="newPass" label="Password" value={newPass} onChange={setNewPass} autoComplete="new-password" />
              <PasswordField
                id="newPassConfirm"
                label="Confirm password"
                value={newPassConfirm}
                onChange={setNewPassConfirm}
                autoComplete="new-password"
              />
              <button type="submit" disabled={busy} className="btn btn-gold w-full">
                Set password &amp; continue
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
