# Business Skills Lernhub

Static GitHub Pages study site for Kevin's Handelsdiplom VSH (BVS St. Gallen): Business Skills I (BWL, Dozent Frank Sehling) and II (Recht, Dozent Kevin Strebel). Live: https://flkevin23.github.io/Business-Skills/

Goal: 80+/100 at the exams with minimal study time. Running project: Kevin adds new class material (PDFs from OpenOlat) after each lesson.

## Structure
- `index.html` dashboard: countdowns, `PREP` checklist per class date (inline script), timeline, progress.
- `js/site.js` nav, theme, `Store` (localStorage, prefix `bs.`), `SCHEDULE` (all lessons), `QUIZZES` (progress list).
- `js/quiz.js` quiz engine (`Quiz.mount(el, cfg)`), types tf / mc / match / open; `exam:true` + `minutes` for simulations.
- `js/cards.js` flashcards (`CARDS`), Leitner spaced repetition in `karten.html`. Card ids must stay stable.
- `bwl/keN.html`, `recht/keN.html` one page per Kurseinheit: Lernziele, sections with `.core` (one-sentence core), `.lightbulb` (Eselsbrücke), `.examtip`, `.warn`, then a `#check` quiz.
- `recht/vorschau.html` preview of upcoming Recht lessons (built from OR + Stoffplan, replace with teacher content once slides exist).
- `bwl/zp.html` self-made Zwischenprüfung; `bwl/nullserie.html`, `recht/nullserie.html` official Nullserien.
- `pdfs/` original BVS PDFs (Kevin chose to keep them in the public repo, like his Finance-Bookkeeping repo).

## Adding a new lesson
1. Extract slide text (PyMuPDF is in `~/Downloads/Immoland/.venv`); render image-only slides to check diagrams.
2. New page `bwl/keN.html` / `recht/keN.html` in the existing pattern; add to nav in `js/site.js` and `QUIZZES`.
3. Add `page:` to the SCHEDULE entry, add flashcards to `js/cards.js`, add a `PREP` entry for the next class date.
4. Copy PDFs to `pdfs/` with lowercase names.

## Content rules
- German site text, Swiss spelling: "ss", never "ß". No em dashes.
- Teach for exams: short core sentence, memory hook, how the exam asks it, common traps. Cite OR/ZGB articles.
- Mark content not yet covered in class with `later:` on questions.
