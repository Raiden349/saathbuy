# Design review

## Home

- Review: `design-review/home-375.png` at 375x812 and `design-review/home-1280.png` at 1280x800.
- Uses the supplied mark and wordmark on paper, with the exact Outfit and Hanken Grotesk fonts.
- The four bottom tabs fit at the 375 px viewport and meet the 44 px tap target requirement.
- The page stays left-aligned and quiet, with paper background, ink text, and only the allowed deep tab state.
- Decorative elements removed: none. The shell has no decoration to remove.
- Remaining deviation: deal content is not shown until Phase 4 adds the live Home experience.

## Login and signup

- Review: `design-review/login-375.png` and `design-review/signup-375.png` at 375x812.
- Both screens use the supplied full logo, paper background, Outfit headings, Hanken Grotesk body text, deep teal primary action, and 48 px form controls.
- Login has a compact left-aligned form. Signup keeps all five required fields, including department and student type, in a single vertical flow that can scroll on shorter devices.
- No app header or bottom tabs appear on the standalone auth screens.
- Remaining owner action: allowlist the local and production `/auth/callback` URLs in Supabase before testing confirmation emails.
