import { z } from "zod";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.").refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number(value.slice(0, 4)) >= 100 && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Enter a real date.");
const fields = {
  name: z.string("Enter an event name.").trim().min(1, "Enter an event name.").max(120, "Use at most 120 characters."),
  date: z.union([date, z.literal("")]).nullable().optional(),
  time: z.union([z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time."), z.literal("")]).nullable().optional(),
  venueName: z.string().trim().max(200, "Use at most 200 characters.").nullable().optional(),
  latitude: z.number("Enter a valid latitude.").min(-90, "Latitude must be between -90 and 90.").max(90, "Latitude must be between -90 and 90.").nullable().optional(),
  longitude: z.number("Enter a valid longitude.").min(-180, "Longitude must be between -180 and 180.").max(180, "Longitude must be between -180 and 180.").nullable().optional(),
};
function venue(value: { venueName?: string | null; latitude?: number | null; longitude?: number | null }, ctx: z.RefinementCtx) {
  const keys = ["venueName", "latitude", "longitude"] as const;
  if (!keys.some(key => Object.prototype.hasOwnProperty.call(value, key))) return;
  const clear = (value.venueName === null || value.venueName === "") && value.latitude === null && value.longitude === null;
  const complete = !!value.venueName && typeof value.latitude === "number" && typeof value.longitude === "number";
  if (!clear && !complete) ctx.addIssue({ code: "custom", path: ["venueName"], message: "Enter the venue name and both coordinates, or clear all three." });
}
export const createEventSchema = z.object(fields).strict().superRefine(venue);
export const patchEventSchema = z.object({ ...fields, name: fields.name.optional(), order: z.number("Enter a valid event position.").int("Enter a whole-number event position.").min(1, "Event position must be at least 1.").optional() }).strict()
  .refine(value => Object.keys(value).length > 0, "Choose something to update.").superRefine(venue);

export function eventInputError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue?.path.length) return "Check the event details.";
  if (["invalid_type", "invalid_union"].includes(issue.code)) {
    return ({ name: "Enter an event name.", order: "Enter a valid event position.", date: "Enter a valid date.", time: "Enter a valid time.", venueName: "Enter a valid venue name.", latitude: "Enter a valid latitude.", longitude: "Enter a valid longitude." } as Record<string, string>)[String(issue.path[0])] ?? "Check the event details.";
  }
  return issue.message;
}
export type EventInput = z.infer<typeof createEventSchema>;
export type EventPatch = z.infer<typeof patchEventSchema>;
