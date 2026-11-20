# When I'm Gone — package decisions

- Build 1.0 (1), bundle com.victoryontherock.whenimgone. Packaged
  2026-11-19 from the web app source
  (~/workspace/ts-spaces/when-i-m-gone/index.html, single self-contained
  file, no external references). www is byte-identical to the web
  source — no package-only content changes. Package structure copied
  from the Tell Me Your Story package (Capacitor 8, SPM iOS project,
  Codemagic TestFlight workflow).
- WHAT IT IS: an on-device organizer a person fills in while alive so
  their family is never left guessing — My Funeral Plan; My Will & My
  Executor; Where Everything Is; Who to Call; Who Gets What; Messages
  for My Family; My Faith (voluntary); a What Will It Cost? page about
  the companion app Save on Dying; and Share My Plan, which gathers
  only the filled-in parts into one clean plain-text plan to copy and
  hand to an executor or family. All data lives on-device only
  (localStorage key "whenImGone.v1"). No account, no login, no
  server, no subscription.
- OWNERSHIP: Cole & Fix Ventures (Carson Cole + Steven Fix, 50/50).
  Money-apps program #4 — pulled forward by Carson's direct order
  Nov 19, 2026 ("let's do it... It'll go good with Save on Dying").
  It is Save on Dying's companion: Save on Dying prices the funeral,
  When I'm Gone holds the plan.
- BUNDLE ID CONVENTION: the task brief suggested
  com.coleandfix.whenimgone, but every sibling Cole & Fix package
  (Save on Dying, Covenant Courtship, Fix It First) ships under
  com.victoryontherock.* because the apps build under Carson's Apple
  team — so this package follows the house convention:
  com.victoryontherock.whenimgone.
- PAID APP — CA$19.99 one-time, entered at App Store submission under
  the paid-apps agreement. NO DONATE PANEL: verified by grep — 0
  matches for "donate" in the packaged www, and none was added.
- THE NOT-A-WILL LINE (locked wording, on the Will screen, verbatim):
  "This app is not a will. It helps your family find yours."
  The Will screen records only where the will is kept, the executor's
  name and phone, and the lawyer's name and phone. The About Wills in
  Canada page is plain information only — what a will is, why it
  matters, what an executor does, what happens without one — clearly
  not legal advice, and the app contains NO will-making form and no
  legal documents. Who Gets What carries the same honesty: the wishes
  are for the family; the will is what speaks legally.
- PRE-SALE GATE (standing, do not ship past it): STEVE FIX reviews
  the will/estate wording in this app before When I'm Gone is sold.
  The build may sit in TestFlight, but no App Store sale until Steve
  has seen the Will screen, the About Wills in Canada page, and the
  Who Gets What line.
- WHERE EVERYTHING IS carries the verbatim note: "Don't write
  passwords or PINs in here — just where things are and who to ask."
  Bank fields ask for bank names and places only.
- TALK-TO-FILL: a big 🎤 Talk button beside every free-text field in
  every section (Tell Me Your Story / Before You Say I Do pattern —
  web SpeechRecognition, en-CA, continuous + interim, one shared
  session, words appended and saved through the field's normal input
  handler). If speech is unavailable the app shows one plain line:
  "Talking isn't available here — typing works just fine." Typing
  always works; the form never blocks. MIC PERMISSION RULE honoured:
  Info.plist carries BOTH NSMicrophoneUsageDescription and
  NSSpeechRecognitionUsageDescription — the app asks inside the app
  on first Talk tap; nobody is sent to Settings. Android declares
  RECORD_AUDIO.
- TONE AND CONTENT RULES: calm, warm, hopeful — an act of love, not
  a morbid app. Capitalization of God/Jesus/Christ/Holy Spirit/Most
  High and divine pronouns honoured in all copy. Matthew 5:4 is
  NEVER used (it is not a bereavement verse); the only comfort
  verses in the app come from the approved list (Psalm 23,
  Psalm 34:18, John 14:1–3, Isaiah 41:10, 2 Corinthians 1:3–4,
  Revelation 21:4) — verified by grep: no "5:4" anywhere.
- SAVE ON DYING PAGE: names the companion in full and says it is
  coming to the App Store. NO links or store buttons — Save on Dying
  is not live in the store yet, and the app makes no claim that it is.
- SHARE MY PLAN is copy-based (one big COPY MY PLAN button): there is
  deliberately no Print button — window.print is dead inside the app
  shell, and a button that does nothing is worse than none. The plan
  text is print-clean when pasted or opened in a browser.
- TIPS ON/OFF switch: present (top of Home), remembered on-device in
  the same store; tips are short pop-up-style lines only — no
  instruction walls anywhere (80/8 rule: every tap target ≥56px,
  main buttons bigger; big BACK and HOME buttons on every screen).
- VERIFICATION (Nov 19, 2026, builder's probe + Baruch's independent
  jsdom DOM walk of the exact packaged file): all 11 screens reached
  by tapping the app's own buttons; every free-text field carries a
  Talk button (Funeral 8/8, Will 5/5, Where 6/6, Faith 2/2; list
  entries 3/3 Call, 3/3 Gets, 2/2 Messages after adding); talk
  fallback line shown exactly as specified; entries typed in Funeral,
  Call, Gets and Messages auto-saved and appeared in the Share plan
  under headed sections, in the entered words, with unfilled
  sections omitted; Home showed "Started ✓"; TIPS toggle flipped
  and persisted; zero JavaScript errors across the whole walk.
  Live dictation and the iOS permission prompt can only be proven on
  Carson's phone in TestFlight, as with every voice app.
- ICON: open door with warm morning light (generated Nov 19, 2026),
  icon.png + AppIcon-512@2x.png at 1024×1024.
- GIT: repo pastorcarsoncole/when-im-gone, remote set to the house
  SSH route (ssh.github.com:443 via the proxy-connect helper). As of
  packaging, the GitHub repo itself still has to be created (one
  browser step — no API token on this machine); the local commit is
  ready and the push is a single command once the empty repo exists.
