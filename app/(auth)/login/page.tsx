import Image from "next/image";
import Link from "next/link";
import { signInAction } from "@/app/actions/auth";

type LoginPageProps = {
  searchParams: Promise<{ issue?: string; notice?: string; next?: string }>;
};

const issueCopy: Record<string, string> = {
  invalid: "Enter a valid email and password.",
  credentials: "Email or password did not match. Check them and try again.",
  confirmation: "That confirmation link is invalid or expired. Sign in or request another link.",
  configuration: "Sign-in is not configured yet. Ask the SaathBuy admin to check the site settings.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const issue = params.issue ? issueCopy[params.issue] : undefined;
  const notice = params.notice === "signed-out" ? "You are signed out." : undefined;

  return (
    <main className="auth-main">
      <div className="auth-content">
        <div className="auth-logo">
          <Image src="/brand/logo-full.png" alt="SaathBuy" width={1154} height={1060} priority style={{ width: 140, height: "auto" }} />
        </div>
        <h1 className="auth-title">Log in</h1>
        {issue && <p className="auth-message auth-error" role="alert">{issue}</p>}
        {notice && <p className="auth-message" role="status">{notice}</p>}
        <form action={signInAction} className="auth-form">
          <label className="form-field">
            <span>Email</span>
            <input autoComplete="email" className="form-input" name="email" type="email" required />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input autoComplete="current-password" className="form-input" name="password" type="password" minLength={6} required />
          </label>
          <input name="next" type="hidden" value={params.next ?? "/"} />
          <button className="button-primary" type="submit">Log in</button>
        </form>
        <p className="auth-switch">New to SaathBuy? <Link href="/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
