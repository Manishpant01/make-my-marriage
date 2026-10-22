# Stitch prompt — toast

Paste this into the existing MakeMyMarriage screens. It only changes the toast. Do not redraw the page under it.

## Prompt

```
Update the toast on MakeMyMarriage. Keep the page behind it. Do not move the form, the sidebar, or the header. English only.

The toast sits at the top right, below the header, about 24px from the right edge and about 24px below the header. It is about 320 wide. Fill #FFFCF8, hairline border, 8px corners, no shadow. Modern grotesque. Text 14px. It stays on screen. It is not a dialog and it does not dim the page.

Show two toasts, stacked, with 8px between them. Desktop 1440, and the same pair at 390 wide. On mobile they stretch across the screen with 16px side margins.

Each toast is one row. At the start, a circle 22px wide. Then the message, near-black or red, vertically centered, with 12px between the circle and the words and 16px of padding around the row. Remove the thin colored bar. The circle is the signal.

Success, the top toast. The circle is filled #2F6B4F. Inside it, a white check, small and clear. The card border is #E7E1D8. The words are near-black #1C1917: “The couple is saved.”

Error, the toast under it. The circle is filled #9F2D2D. Inside it, a white cross, the same size as the check. The card fill is #F8E8E6 and the border is #9F2D2D. The words are #9F2D2D: “Something went wrong.”

The rest of the palette stays as it is. Ivory page #F6F3EE. Bronze #8C6A45 is not used on the toast. No second icon, no close mark, no title, no button.

When the toast appears, it fades in and rises 8px into place, 180ms, ease-out. The check and the cross are visible at rest, so the frame does not depend on the motion.

Do not add a banner, a modal, confetti, or a third toast. Do not change the colors of the page.
```
