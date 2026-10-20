"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonClass, fieldClass } from "@/components/wordmark";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {off ? <path d="M5 19 19 5" /> : null}
    </svg>
  );
}

function Field({
  id,
  label,
  type,
  autoComplete,
}: {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-[14px]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && visible ? "text" : type}
          autoComplete={autoComplete}
          required
          className={isPassword ? `${fieldClass} pr-12` : fieldClass}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bronze"
          >
            <EyeIcon off={visible} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FormError({ message }: { message: string }) {
  if (!message) {
    return null;
  }
  return (
    <p
      role="alert"
      className="mb-5 rounded-lg bg-danger-soft px-3 py-2.5 text-[14px] text-danger"
    >
      {message}
    </p>
  );
}

function SubmitButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass} min-h-12 w-full text-[15px]`}
    >
      {label}
    </button>
  );
}

function SwitchLine({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-[14px] text-muted">{children}</p>;
}

async function postAuth(path: string, body: Record<string, FormDataEntryValue>) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Something went wrong.");
  }
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      await postAuth("/api/auth/login", {
        email: form.get("email") ?? "",
        password: form.get("password") ?? "",
      });
      router.push("/home");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
      />
      <p className="mb-6">
        <Link
          href="/forgot-password"
          className="text-[14px] text-muted transition-colors hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          Forgot password
        </Link>
      </p>
      <FormError message={error} />
      <SubmitButton pending={pending} label="Log in" />
      <SwitchLine>
        New here?{" "}
        <Link
          href="/signup"
          className="text-ink underline decoration-line underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          Create an account
        </Link>
      </SwitchLine>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      await postAuth("/api/auth/signup", {
        name: form.get("name") ?? "",
        email: form.get("email") ?? "",
        password: form.get("password") ?? "",
      });
      router.push("/home");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field id="name" label="Name" type="text" autoComplete="name" />
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
      />
      <FormError message={error} />
      <SubmitButton pending={pending} label="Create account" />
      <SwitchLine>
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-ink underline decoration-line underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          Log in
        </Link>
      </SwitchLine>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setPending(true);
    try {
      await postAuth("/api/auth/forgot-password", {
        email: form.get("email") ?? "",
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field id="email" label="Email" type="email" autoComplete="email" />
      <FormError message={error} />
      <SubmitButton pending={pending} label="Send reset link" />
      <SwitchLine>
        <Link
          href="/login"
          className="text-ink underline decoration-line underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bronze"
        >
          Log in
        </Link>
      </SwitchLine>
    </form>
  );
}
