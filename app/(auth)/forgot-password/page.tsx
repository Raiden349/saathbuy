import Image from "next/image";
import Link from "next/link";
import { PasswordResetForm } from "@/components/password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-main">
      <div className="auth-content">
        <div className="auth-logo">
          <Image src="/brand/logo-full-on-dark.png" alt="SaathBuy" width={1154} height={1060} priority style={{ width: 140, height: "auto" }} />
        </div>
        <h1 className="auth-title">Reset your password</h1>
        <PasswordResetForm />
        <p className="auth-switch"><Link href="/login">Back to log in</Link></p>
      </div>
    </main>
  );
}
