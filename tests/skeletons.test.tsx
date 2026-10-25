import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { AuthSkeleton, HomeSkeleton, JoinSkeleton, WorkspaceSkeleton, WeddingSectionSkeleton } from "@/components/page-skeletons";
import { WeddingLoadingContext } from "@/components/wedding-loading-context";
import { WeddingSection } from "@/components/wedding-panel";

test.each([["home", createElement(HomeSkeleton)], ["workspace", createElement(WorkspaceSkeleton)], ["join", createElement(JoinSkeleton)], ["account", createElement(AuthSkeleton)]] as const)(
  "%s announces loading without pretending placeholder controls are usable",
  (_name, element) => {
    const html = renderToStaticMarkup(element);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('role="status"');
    expect(html).toContain("Loading");
    expect(html).not.toMatch(/<(?:button|input|select|form)\b|<a\s/);
    expect(html).not.toContain("animate-spin");
  },
);

test.each(["dashboard", "couple", "invitation", "family", "invite-family"])(
  "the %s skeleton stays visible without JavaScript and only pulses when motion is allowed",
  section => {
    const html = renderToStaticMarkup(createElement(WeddingSectionSkeleton, { section }));
    expect(html).toContain("motion-safe:animate-pulse");
    expect(html).not.toMatch(/opacity:\s*0|visibility:\s*hidden|\shidden=/);
  },
);

test("pending section navigation hides but preserves the outgoing form alongside a readable skeleton", () => {
  const html = renderToStaticMarkup(<WeddingLoadingContext.Provider value="family">
    <WeddingSection><input name="draft" defaultValue="Unsaved name" /></WeddingSection>
  </WeddingLoadingContext.Provider>);
  expect(html).toContain('data-wedding-panel="true"');
  expect(html).toContain('<div hidden=""><input');
  expect(html).toContain('value="Unsaved name"');
  expect(html).toContain("Loading family");
});

test("idle workspace content has no skeleton or hidden form", () => {
  const html = renderToStaticMarkup(<WeddingSection>The wedding details</WeddingSection>);
  expect(html).toContain("The wedding details");
  expect(html).not.toContain("Loading");
  expect(html).not.toContain('hidden=""');
  expect(html).not.toContain('aria-busy="true"');
});
