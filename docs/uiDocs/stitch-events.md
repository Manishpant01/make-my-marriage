# Stitch prompt — event planning

Design scope: 26 October 2026. Events list, add/edit, reorder, deletion, and feedback on desktop and mobile. Design only; no feature implementation is implied. Follow [typography.md](typography.md), [animations.md](animations.md), and the Events sections of `docs/api-design.md` and `docs/database-design.md`.

## Product and interaction rules

- Admins and joined helpers can add, edit, reorder, and delete events. Guests have no editor access. Do not label event actions ADMINS.
- Default order: Roka / engagement, Haldi, Mehendi, Sangeet, Wedding ceremony, Reception, Vidaai. Display saved family order, not an automatic date sort.
- Name is required. Date and time are optional, local India Standard Time. Venue is optional, but venue name, latitude, and longitude are written together. Omit fabricated venue/date values from unplanned rows.
- The wedding span is context, not an event-date editor. No event-date-within-span restriction is specified in current product/API docs; do not invent a hard restriction or change wedding dates on event save.
- Add appends an event to the schedule. Edit preserves its current order unless a reorder action is requested. Do not add event descriptions, end times, budgets, assigned people, or RSVP editors in this slice.
- Venue entry must respect the documented coordinates. Use an optional venue group with Venue name, Latitude, and Longitude. Validate numeric latitude -90..90 and longitude -180..180 when a venue is supplied. All three may remain blank. Do not pretend a place-name string is a resolved location. A provider-backed place search/map may replace manual coordinates only after that service and selection contract are explicitly chosen; it is not part of this design task.
- Clearing optional values needs a corresponding API clearing contract; the older API does not specify null/empty semantics. Design the clear controls but document this integration requirement rather than promising undocumented behavior.
- Use explicit Move up/Move down in reorder mode, saving each movement through the existing per-event order update. There is no separate bulk Save order API. Disable invalid first/last moves and repeated changes while a move saves. Cross-page moves must use global order; do not treat a visible page as the entire schedule.
- Delete removes the event from guest invitation event selections and removes its RSVP answers. It does not delete guests or other wedding records. No undo/restore endpoint is documented.
- WhatsApp sharing and YouTube editing are separate later slices. Preserve existing navigation but do not introduce those editors here.

## Paste into Stitch

```text
Design the Events management flow inside the existing MakeMyMarriage workspace. Create Events list, Add event, Edit event, Reorder mode, and Delete confirmation, plus loading/empty/error/success variants. Produce desktop 1440px and genuine mobile 390px layouts. Match the current shared shell and premium minimal style.

VISUAL SYSTEM
Outfit for all event headings, names, dates, labels, buttons, and numbers. Fraunces only for any existing prominent couple-name heading; do not add decorative serif headings to this functional flow. Preserve the logo and palette: ivory #F6F3EE, surface #FFFCF8, ink #1C1917, muted #6B6560, bronze #8C6A45, hover #74583A, borders #E7E1D8. Use existing success green/error red only for feedback. Fine borders, 8px corners, comfortable spacing, no heavy shadows, gradients, illustrations, avatars, or new imagery.

SHARED LAYOUT
Keep the existing header/sidebar, select Events, and replace only the main column. Keep the signed-in name plain text. Preserve current navigation labels, order, permissions, and mobile approach. Use a generous 48–56px gap after the desktop sidebar and the full available content width. Admins and joined helpers can manage events equally; no ADMINS label on event actions.

EVENTS LIST
Title Events. Supporting sentence “Plan the days, in your order.” Show saved wedding span as quiet context: “Priya and Rahul · 12–14 March 2027”. This compact context stays in Outfit.

Primary action Add event; secondary Reorder. Show an ordered list with a small sequence number, event name, Date, Time, Venue, and a clear Edit action. Put deletion inside Edit to keep the list calm. Use light separators and generous row padding. Desktop aligns columns; mobile stacks metadata beneath the name with labels and a clear Edit target. Event order is chosen by the family, never automatically sorted by date.

Default sequence: Roka / engagement, Haldi, Mehendi, Sangeet, Wedding ceremony, Reception, Vidaai. In the initial state all dates, times, and venues are empty: show quiet “Not set” text rather than invented details. Also create a mixed-planning example, such as Mehendi on 12 March 2027, 4:00 pm IST, at Rosewood Hall, alongside unplanned events. No planning-progress chart, completion percentage, or status badges are needed.

Show a creator's seven-event schedule and a genuinely empty state after all events are removed: “No events yet. Add the first event to start your schedule.” Include Add event. If pagination is needed, use simple Previous/Next; do not add search or filter UI.

ADD / EDIT EVENT
Use the same main column as a dedicated editor view, not a cramped popup. Include Back to events, Add event or Edit event heading, a spacious form panel, primary Add event / Save changes, and secondary Cancel. Use a shared editor layout. Desktop Name is full width, Date and Time share a row; mobile stacks all fields. Show a short note “Times are in India Standard Time (IST).” Use readable date/time controls with clear affordances.

Fields:
• Event name — required.
• Date — optional.
• Time — optional.
• Optional Venue group: Venue name, Latitude, Longitude. All three can remain empty; when a venue is supplied require all three. Coordinates use decimal numeric values, including negatives. Show a quiet explanation of the complete location requirement. Do not introduce a map service, fake location search results, address autofill, or permission requests.

Show an example edit form with Mehendi, 12 March 2027, 4:00 pm IST, Rosewood Hall, latitude 28.6139, longitude 77.2090. Treat these as sample design data. Allow clearing optional date/time/location details; location clears as a complete group. Do not silently change the wedding's own dates or hard-restrict event dates to that span.

Add places the event at the end. Edit keeps its position. On successful save, return to Events with updated content and existing green-check toast. Validation and failed saves preserve entered values and remain in the form. Inline errors cover missing name, invalid date/time, partial venue, and out-of-range coordinates. Temporary errors have a retry action. Buttons show Adding… / Saving… with stable width and prevent duplicate submission. Cancel and Back return without saving; if dirty, show a small accessible discard confirmation with Keep editing and Discard changes.

In Edit, separate Delete event from Save with whitespace and a fine divider. Use a quiet red text action consistent with existing danger styling.

REORDER MODE
Reorder changes the list into a clear compact sequence of event names with Move up and Move down controls. Retain enough date context to identify each event, but avoid crowded metadata. Provide an explicit Done control returning to the ordinary list. Explain “Moves save automatically.” Done does not pretend to save a separate draft.

Each movement saves immediately. Disable Move up for the first event and Move down for the last, and disable reorder interaction during the pending save. Show a small Saving order… status. After success, update numbering and announce the new position. On failure restore the previous order, explain “The order couldn't be saved”, and offer Try again. Preserve all events. If only one event exists, Reorder is unavailable.

Use keyboard/touch-accessible text controls as the primary method. Dragging is unnecessary. Do not add drag handles that lack a working alternative. Pagination does not reset global order; enable movement across page boundaries only if the complete behavior is supported.

DELETE CONFIRMATION
Open an accessible dialog from Delete event in Edit. Title “Delete Mehendi?” Text: “This removes Mehendi from the schedule and from guest invitations. Replies for this event will also be removed. Guests and the other events will stay.” Actions Keep event and Delete event. Do not show a delete count unless real data supplies it.

Use the existing ivory surface, hairline border, and 8px corners, with a restrained dark backdrop. On mobile use a dialog fitting the screen with comfortable margins. Focus stays inside the dialog and returns sensibly after closing. Deleting… prevents repeats. Failure keeps the dialog open with its message and retry. Success closes it and returns to the updated Events list with a toast. Do not add Undo or claim deletion is reversible.

LOADING / FEEDBACK
Reuse existing skeleton language: header/sidebar stay available while skeletons occupy only the main column. Show list-shaped placeholders for Events and editor-shaped placeholders for a loading editor, with a screen-reader loading status. Existing content may remain visible while saving; do not replace a dirty form with skeletons. Avoid artificial loading delays.

Distinguish failed list load (Try again) from a real empty list. Preserve current list content on failed mutations. Use existing green-check/red-cross toast treatment; persistent field/dialog errors must remain understandable after a toast disappears. No new full-page success screen.

MOTION / ACCESSIBILITY
Use the shared Motion behavior: stationary shell, 100ms outgoing fade, incoming panels opacity 0→1 and rise 8px→0 over 220ms ease-out. Stagger rows by 40ms with delays capped so the sequence finishes around 500ms. The editor enters as one unit; fields never enter separately. Reordered rows may settle to their new positions over 180ms without bounce. Do not replay the whole entrance after saves, edits, validation, pagination, or reorder.

Dialogs enter with a short 160–200ms fade and at most 6px movement. Keep button hover/press feedback restrained. Provide visible keyboard focus, meaningful labels, approximately 44px touch targets, accessible position announcements, and reduced-motion behavior removing lift/stagger/translation. Color must not be the only error signal. Do not make informational rows look clickable unless they open Edit.

PROTOTYPE / OUTPUT
Connect existing Dashboard Add an event to Add event; Events sidebar to Events list; Add event → editor → successful list; Edit → editor → saved list; Cancel/Back → list; Reorder → move → Done → list; Delete → confirm/cancel/failure/success. Keep Dashboard and Weddings navigation destinations intact. Show that event changes eventually update the same schedule on Dashboard and Invitation preview, without duplicating editors there.

Organize primary screens and named state variants clearly for desktop/mobile review. Demonstrate supported interactions in the preview; identify unsupported effects in the handoff. Keep WhatsApp sharing, YouTube fields, RSVP editing, vendors, payments, tasks, and new venue providers outside this design slice.
```

## Implementation handoff checks

Review duplicate submits, direct editor entry, first/last moves, single-event and all-deleted cases, global order across pagination, stale/deleted event responses, mutation failure recovery, unsaved edits, focus after dialog close/delete, and reduced motion. Refresh Dashboard and the Invitation preview from the same saved event data. Resolve optional-field clearing and server validation contracts before implementation; documentation does not create endpoints. Add no project-status feature entry until code lands.
