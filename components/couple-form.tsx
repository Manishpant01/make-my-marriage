"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/toast";
import { buttonClass, fieldClass } from "@/components/wordmark";

const saveClass = `${buttonClass} h-12 w-full px-8 text-[14px] transition duration-180 ease-out enabled:hover:bg-bronze-hover enabled:hover:opacity-100 motion-safe:enabled:hover:-translate-y-px motion-safe:enabled:active:translate-y-0 disabled:transform-none sm:w-auto`;

export function CoupleForm({
  weddingId,
  brideName,
  groomName,
  startDate,
  endDate,
}: {
  weddingId: string;
  brideName: string;
  groomName: string;
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) {
      return;
    }
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brideName: form.get("brideName"),
          groomName: form.get("groomName"),
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok) {
        const message = body?.error ?? "Something went wrong.";
        setError(message);
        toast.error(message);
        submitting.current = false;
        setPending(false);
        return;
      }
      toast.success("The couple is saved.");
      router.replace(`/home/${weddingId}?section=couple`);
      router.refresh();
      submitting.current = false;
      setPending(false);
    } catch {
      setError("Something went wrong.");
      toast.error("Something went wrong.");
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="w-full rounded-lg border border-line bg-surface p-6 lg:p-10"
    >
      <SectionTitle title="Couple" />
      <p className="mb-5 text-[14px] text-muted">
        The names on the invitation, and the first and last day.
      </p>
      <div className="mb-8 h-px w-12 bg-bronze" />
      {error ? <FormError message={error} /> : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <TextField id="brideName" label="Bride’s name" value={brideName} />
        <TextField id="groomName" label="Groom’s name" value={groomName} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
        <DateField id="startDate" label="Start date" value={startDate} />
        <DateField id="endDate" label="End date" value={endDate} />
      </div>
      <FormActions pending={pending} />
    </form>
  );
}

function TextField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required
        maxLength={80}
        defaultValue={value}
        autoComplete="name"
        className={`${fieldClass} h-12`}
      />
    </div>
  );
}

function DateField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="date"
        required
        defaultValue={value}
        className={`${fieldClass} h-12`}
      />
    </div>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-4">
      <h1 className="text-[24px] font-medium tracking-tight">{title}</h1>
      <span className="text-[11px] font-medium tracking-[0.06em] text-muted uppercase">Admins</span>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mb-4 rounded-lg bg-danger-soft px-3 py-2.5 text-[14px] text-danger"
    >
      {message}
    </p>
  );
}

export function FormActions({ pending }: { pending: boolean }) {
  return (
    <div className="pt-7">
      <button type="submit" disabled={pending} className={saveClass}>
        Save
      </button>
    </div>
  );
}
