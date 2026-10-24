"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { WeddingPanel } from "@/components/wedding-panel";
import { toast } from "@/components/toast";
import { fieldClass } from "@/components/wordmark";
import { FormActions, FormError, SectionTitle } from "@/components/couple-form";

export function InvitationPanel({
  weddingId,
  brideName,
  groomName,
  datesLabel,
  message,
  events,
}: {
  weddingId: string;
  brideName: string;
  groomName: string;
  datesLabel: string;
  message: string;
  events: { id: string; name: string }[];
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState(message);
  const shown = draft.trim();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) {
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/weddings/${weddingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationMessage: draft }),
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
      toast.success("The invitation is saved.");
      router.replace(`/home/${weddingId}?section=invitation`);
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
    <div className="grid w-full grid-cols-1 items-start gap-8 lg:grid-cols-2">
      <WeddingPanel>
      <form
        onSubmit={onSubmit}
        className="w-full rounded-lg border border-line bg-surface p-6 lg:p-10"
      >
        <SectionTitle title="Invitation" />
        <p className="mb-8 text-[14px] text-muted">
          One card for every guest. The names are corrected on Couple.
        </p>
        {error ? <FormError message={error} /> : null}
        <label htmlFor="invitationMessage" className="text-[14px] font-medium">
          Message
        </label>
        <textarea
          id="invitationMessage"
          name="invitationMessage"
          rows={6}
          maxLength={400}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className={`${fieldClass} mt-2 resize-none leading-relaxed`}
        />
        <FormActions pending={pending} />
      </form>
      </WeddingPanel>
      <WeddingPanel delay={0.04} className="w-full rounded-lg border border-line bg-surface p-3">
        <div className="rounded border border-line px-6 py-10 text-center lg:px-10">
          <Image
            src="/marigold.svg"
            alt=""
            width={48}
            height={64}
            className="mx-auto h-24 w-auto"
          />
          <h2 className="mt-6 wrap-anywhere font-display text-[28px] font-medium leading-[1.25] tracking-[-0.02em] lg:text-[32px]">
            {brideName} and {groomName}
          </h2>
          <p className="mt-1 text-[13px] tabular-nums text-muted">{datesLabel}</p>
          <p
            className={`mt-4 text-[13px] whitespace-pre-wrap break-words ${
              shown ? "text-ink" : "text-muted"
            }`}
          >
            {shown || "The message appears here."}
          </p>
          <div className="mx-auto my-6 h-px w-full max-w-[280px] bg-line" />
          <div className="space-y-2.5 text-[13px] tracking-wide">
            {events.map((event) => (
              <div key={event.id}>{event.name}</div>
            ))}
          </div>
        </div>
      </WeddingPanel>
    </div>
  );
}
