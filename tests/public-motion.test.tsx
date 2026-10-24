import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
import HomePage from "@/app/page";
import { AuthScreen } from "@/components/auth-screen";
import { LoginForm, SignupForm } from "@/components/auth-forms";
import { StartWeddingForm } from "@/components/start-wedding-form";
import { Entrance } from "@/components/entrance";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

function readable(html: string) {
  expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden|\sinert(?:=|\s|>)/);
}

test("landing content and eager hero image exist before hydration or scrolling", () => {
  const html = renderToStaticMarkup(createElement(HomePage));
  readable(html);
  expect(html).toContain("The wedding, in one place.");
  expect(html).toContain("What the family works on");
  expect(html).toContain("Coming up");
  expect(html).toMatch(/<img[^>]+loading="eager"[^>]+landing-hero/);
  expect(html).toContain('href="/signup"');
});

test.each([["Log in", LoginForm], ["Create an account", SignupForm]] as const)(
  "%s keeps password-manager fields available before hydration",
  (title, Form) => {
    const html = renderToStaticMarkup(<AuthScreen title={title}><Form /></AuthScreen>);
    readable(html);
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).toContain('autoComplete="email"');
    expect(html).toMatch(/autoComplete="(?:current|new)-password"/);
    expect(html).toContain(title);
  },
);

test("setup retains native date inputs and both role choices", () => {
  const html = renderToStaticMarkup(createElement(StartWeddingForm));
  readable(html);
  expect(html.match(/type="date"/g)).toHaveLength(2);
  expect(html).toContain("The bride");
  expect(html).toContain("The groom");
});

test("animated wedding rows remain direct list items", () => {
  const html = renderToStaticMarkup(createElement("ul", null,
    <Entrance as="li">Anika and Rohan</Entrance>,
  ));
  expect(html).toBe("<ul><li>Anika and Rohan</li></ul>");
});
