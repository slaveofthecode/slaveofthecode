# Ingest notes

Open questions from the PDF → JSON ingest (PR-4). The resume source is English, so
`data/en/*.json` is authoritative and `data/es/*.json` is a **draft translation** awaiting
your review. Answer or edit directly; ambiguous items must not be guessed.

## Questions for the human
- [ ] **Certifications.** The PDF lists "Microsoft Certified Professional (MCP)" and
  "Programming in HTML5 with JavaScript and CSS3 Specialist (Exam 480)" and shows a single
  Credly URL between them. We attached that URL to the HTML5 Specialist (matches the old
  portfolio). Please confirm: does MCP have its own URL/date, or is the shared URL correct?
- [ ] **Portfolio link.** We used `https://slaveofthecode.vercel.app/` (from the old site).
  Confirm the URL to publish (or remove the "Portfolio" link).
- [ ] **Nybble Group dates.** The PDF shows `May 2024 – Jun 2026`, but the summary says you
  are "currently focused". Is Nybble your current role (`endDate: null`) or did it end in
  Jun 2026?
- [ ] **Email.** Not published (public repo). Say the word if you want it in `profile.email`.
- [ ] **Spanish draft.** Review `data/es/*.json` wording (roles, highlights, skill-group
  names). Adjust freely; non-text fields are locked by the parity tests.

## Decisions made during ingest (change if you disagree)
- **Content model tweaks** to fit real data (schema in `packages/content`):
  - `experience[].summary` is now **optional** — several roles (especially the older
    "Additional Experience" block) only have highlights/tech.
  - `education[].startDate`/`endDate` and `certifications[].date` accept a **year (`YYYY`)
    or year-month (`YYYY-MM`)** — e.g. ISSD 2001–2006 has no months on the CV.
  - New **`certifications[]`** collection: `{ id, name, issuer, date?, url? }`.
- **Additional Experience.** The six older roles (Mystic, Harriague, Globant, Particular,
  Bancor 2008, Dicicom) are included in `experience[]` in PDF order. There is no
  "featured"/"collapse" flag in the model yet; consider one before PR-6 if the site should
  visually separate them.
- **`now[]` is still mock** (`Example Course`) — `now` is not in the PDF and is maintained
  by hand. Real items come in PR-7.

## Not committed
- The PDF and extracted `content-source/resume.txt` stay local (gitignored); they may
  contain phone/address.
