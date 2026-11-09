import Image from "next/image";
import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";

type SignupPageProps = {
  searchParams: Promise<{ issue?: string; notice?: string }>;
};

const issueCopy: Record<string, string> = {
  invalid: "Add your name, department, student type, email and a password with at least 6 characters.",
  failed: "Account sign-up could not be completed. Check the details and try again.",
  configuration: "Account sign-up is not configured yet. Ask the SaathBuy admin to check the site settings.",
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const issue = params.issue ? issueCopy[params.issue] : undefined;
  const notice = params.notice === "check-email"
    ? "If this email can be registered, check your inbox for a confirmation link."
    : undefined;

  return (
    <main className="auth-main">
      <div className="auth-content">
        <div className="auth-logo">
          <Image src="/brand/logo-full-on-dark.png" alt="SaathBuy" width={1154} height={1060} priority style={{ width: 140, height: "auto" }} />
        </div>
        <h1 className="auth-title">Create your account</h1>
        {issue && <p className="auth-message auth-error" role="alert">{issue}</p>}
        {notice && <p className="auth-message" role="status">{notice}</p>}
        <form action={signUpAction} className="auth-form">
          <label className="form-field">
            <span>Full name</span>
            <input autoComplete="name" className="form-input" maxLength={80} name="full_name" required />
          </label>
          <label className="form-field">
            <span>Department</span>
            <input autoComplete="organization-title" className="form-input" maxLength={80} name="department" required />
          </label>
          <label className="form-field">
            <span>Student type</span>
            <select className="form-input" name="student_type" required defaultValue="">
              <option disabled value="">Choose one</option>
              <option value="hostel">Hostel</option>
              <option value="commuter">Commuter</option>
            </select>
          </label>
          <label className="form-field">
            <span>Email</span>
            <input autoComplete="email" className="form-input" name="email" type="email" required />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input autoComplete="new-password" className="form-input" name="password" type="password" minLength={6} required />
          </label>
          <button className="button-primary" type="submit">Create account</button>
        </form>
        <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
      </div>
    </main>
  );
}
