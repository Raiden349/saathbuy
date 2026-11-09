"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completePasswordReset, requestPasswordResetCode } from "@/app/actions/auth";

export function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState("");
  const [completed, setCompleted] = useState(false);
  const [pending, startTransition] = useTransition();

  function requestCode() {
    setMessage("");
    startTransition(async () => {
      const result = await requestPasswordResetCode(email);
      setMessage(result.message);
      if (result.ok) setCodeSent(true);
    });
  }

  function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    requestCode();
  }

  function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage("");
    startTransition(async () => {
      const result = await completePasswordReset({
        email,
        token: String(formData.get("token") ?? ""),
        password: String(formData.get("password") ?? ""),
        confirm_password: String(formData.get("confirm_password") ?? ""),
      });
      setMessage(result.message);
      if (result.ok) setCompleted(true);
    });
  }

  return (
    <div className="auth-form">
      {!codeSent ? (
        <form className="auth-form" onSubmit={sendCode}>
          <p className="auth-description">Enter the email address on your account. We’ll send a six-digit code to reset your password.</p>
          <label className="form-field">
            <span>Email</span>
            <input autoComplete="email" className="form-input" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="button-primary" disabled={pending} type="submit">{pending ? "Sending code…" : "Send reset code"}</button>
        </form>
      ) : completed ? (
        <div className="auth-form">
          <p className="auth-message" role="status">{message}</p>
          <Link className="button-primary auth-button-link" href="/">Continue to SaathBuy</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={resetPassword}>
          <p className="auth-description">Enter the code sent to <strong>{email}</strong>, then choose a new password.</p>
          <label className="form-field">
            <span>Six-digit email code</span>
            <input autoComplete="one-time-code" className="form-input" inputMode="numeric" maxLength={6} minLength={6} name="token" pattern="[0-9]{6}" required />
          </label>
          <label className="form-field">
            <span>New password</span>
            <input autoComplete="new-password" className="form-input" minLength={6} maxLength={128} name="password" required type="password" />
          </label>
          <label className="form-field">
            <span>Confirm new password</span>
            <input autoComplete="new-password" className="form-input" minLength={6} maxLength={128} name="confirm_password" required type="password" />
          </label>
          {message && <p className="auth-message auth-error" role="alert">{message}</p>}
          <button className="button-primary" disabled={pending} type="submit">{pending ? "Updating password…" : "Change password"}</button>
          <button className="auth-text-button" disabled={pending} onClick={requestCode} type="button">Resend code</button>
          <button className="auth-text-button" disabled={pending} onClick={() => { setCodeSent(false); setMessage(""); }} type="button">Use a different email address</button>
        </form>
      )}
    </div>
  );
}
