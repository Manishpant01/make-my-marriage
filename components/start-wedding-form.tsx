"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buttonClass, fieldClass } from "@/components/wordmark";

const relations = [
  { value: "bride", label: "The bride" },
  { value: "groom", label: "The groom" },
] as const;

export function StartWeddingForm() {
  const router = useRouter();
  const [relation, setRelation] = useState<"bride" | "groom" | "">("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const idempotencyKey = useRef(crypto.randomUUID());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) {
      return;
    }
    if (!relation) {
      setError("Choose the bride or the groom.");
      return;
    }
    const form = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/weddings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          brideName: form.get("brideName"),
          groomName: form.get("groomName"),
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          relation,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        id?: string;
        error?: string;
      } | null;
      if (!response.ok || !body?.id) {
        setError(body?.error ?? "Something went wrong.");
        submitting.current = false;
        setPending(false);
        return;
      }
      router.push(`/home/created?wedding=${body.id}`);
    } catch {
      setError("Something went wrong.");
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col px-5 pt-8 pb-14 lg:px-0 lg:pt-16 lg:pb-24">
      <p className="mb-1 text-[13px] font-medium text-muted lg:mb-1.5">
        Your wedding
      </p>
      <h1 className="mb-2 text-[26px] font-medium leading-tight tracking-tight lg:text-[32px]">
        Start the wedding
      </h1>
      <p className="mb-6 text-[14px] leading-relaxed text-muted lg:mb-8 lg:text-[15px]">
        The couple’s names, and the first and last day.
      </p>
      <div className="relative mb-6 h-40 overflow-hidden rounded-lg bg-line lg:mb-8 lg:h-60">
        <Image
          src="/wedding-setup.jpg"
          alt="A cream invitation on linen with a small flower"
          fill
          priority
          sizes="(min-width: 1024px) 680px, 100vw"
          className="object-cover"
        />
      </div>
      <form className="border-t border-line pt-6 lg:pt-8" onSubmit={onSubmit}>
        {error ? (
          <p
            role="alert"
            className="mb-5 rounded-lg bg-danger-soft px-3 py-2.5 text-[14px] text-danger"
          >
            {error}
          </p>
        ) : null}
        <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
          <Field id="brideName" label="Bride’s name" />
          <Field id="groomName" label="Groom’s name" />
          <Field id="startDate" label="Start date" type="date" />
          <Field id="endDate" label="End date" type="date" />
          <fieldset className="pt-1 lg:col-span-2 lg:pt-2">
            <legend className="mb-2 text-[14px] font-medium">I am</legend>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {relations.map((item) => {
                const selected = relation === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={selected}
                    disabled={pending}
                    onClick={() => setRelation(item.value)}
                    className={`h-[46px] rounded-lg border bg-surface text-[14px] lg:text-[15px] ${
                      selected
                        ? "border-bronze font-medium text-ink"
                        : "border-line font-normal text-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div className="pt-3 lg:col-span-2 lg:pt-4">
            <button
              type="submit"
              disabled={pending}
              className={`${buttonClass} h-12 w-full text-[15px] lg:h-[46px] lg:w-auto lg:px-8`}
            >
              Start the wedding
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  type = "text",
}: {
  id: string;
  label: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 lg:gap-2">
      <label htmlFor={id} className="text-[14px] font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required
        className={`${fieldClass} h-[46px]`}
      />
    </div>
  );
}
