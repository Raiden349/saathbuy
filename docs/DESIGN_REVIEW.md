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

## Home and deal detail

- Review: `design-review/home-375.png`, `design-review/home-1280.png`, `design-review/deal-375.png`, and `design-review/deal-1280.png`.
- Home selects the soonest open deal as the featured block, filters the live list with one horizontally scrolling category row, and separates other deals with 1 px rules instead of repeated cards.
- Deal detail uses the 4:3 supplied product image when it is in the project's public Supabase Storage bucket. Missing or unsupported images use a flat mint-tint category tile.
- SlotRow is the only animated element. It fills a slot once when the live joiner count increases and respects reduced motion.
- Price starts at retail until a tier is reached. The tier ladder uses the stored thresholds and prices; closed deals use the database final price.
- Mobile and desktop screenshots have no horizontal overflow.

## Join and pay

- Review: `design-review/join-375.png` at 375x812, captured with sample values in the temporary local-only preview.
- The page keeps quantity, points, payment method, and a receipt-style total in one column. Wallet reference appears only when Wallet is selected.
- The estimate updates from the current tier, selected quantity, 100-point redemption blocks, and the student's service-fee credit count. The database function remains authoritative when the form is submitted.
- No payment gateway is used. Wallet users enter a transaction ID for pickup verification.

## Pickup and collection

- Pickup details keep the deal name, collection status, quantity, amount due, pickup location, and pickup time in a single left-aligned flow.
- The collection QR is presented on a white field for reliable scanning, with its short code available as a manual fallback.
- The admin scanner supports camera scanning after an explicit user action and a manual code entry path.
- Admin collection and delivery actions use the database RPCs; QR signatures are verified on the server before collection.
- No decorative cards, gradients, shadows, or extra animation were added.

## Rewards and engagement

- Rewards keeps the points balance first, with a single 8 px progress bar toward Rs. 50, a three-slot streak indicator, and a divided points ledger.
- Free-fee credits are shown as a plain count. WhatsApp sharing is available for open deals and includes the current group price and the signed-in user's referral ID.
- Request a deal uses a single-column form and a divided product list sorted by vote count; voting uses a plain count and action button.
- No decorative cards, gradients, shadows, or extra animation were added.
