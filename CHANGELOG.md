# Changelog

## Unreleased

Fixes from a security review. A board file could stop someone communicating, and a failed read could lose their boards.

### Boards and files

- A board file whose words or colours weren't plain text could leave the board blank, or cover it with one button, and lock the adult out of Edit. Words that are numbers are now read as text, other values are left out, and colours must be a plain `#hex` or `rgb()` value; the import lists what it changed. Boards already saved are cleaned up the same way when they're read.
- If a board, or the editor, can't be shown, a message takes its place and Edit and Settings keep working.
- Very large files are refused instead of freezing the app: boards are limited to 30 by 30 places, a file to 2,000 boards, and a .obz's contents to 50 MB a file and 300 MB in all.
- Picture credits only link to web pages (https or http).

### Saving

- If the saved boards couldn't be read when the app started, it spoke from the starter boards, and the next edit saved over the real ones. Now nothing is saved until the boards have been read; the app says so, and tries again when it comes back on screen or when Try again is pressed. Settings get the same protection.
- Import, Start over and restoring a backup keep the boards they replace. Settings → Boards & backup offers to put them back.
- If the saved boards can't be read at all, Import, Start over and restoring a backup can still replace them, after a warning that says so. Ordinary edits stay blocked until the boards are read.
- Two copies of the app open at once (the Home Screen app and a browser tab, say) no longer save over each other's changes. A copy that's behind reads the newer boards and settings instead, and says so if it had a change of its own that wasn't saved.
- Undo no longer reaches back past an import, Start over or restore.

### Edit lock and scanning

- With switch scanning and a switch that acts as a mouse, a press that opened Word forms could open edit mode three seconds later. Edit mode now only opens from a real hold.
- Moving keyboard focus off Edit while holding Enter or Space no longer opens edit mode.

### Speech

- Downloaded voice files are checked against their pinned sizes and hashes before they're kept, and a kept file that doesn't match is downloaded again. A voice that fails falls back to the device voice, as before.
- Old voice engine files from earlier versions are cleared from the cache over time.

### Hosting

- Only pushes to `main` in this repository deploy any-aac.com. Before, a pull request from a fork could trigger a deploy. Only the final deploy step has deploy permissions, and every GitHub Action is pinned to a commit.
- The build includes a `_headers` file with the security headers, and the README says which headers a self-hosted copy should send. The voice lab test page is no longer in the build.
- any-aac.com now sends HSTS and no longer sends Cloudflare's network error reports.

## 0.2.0 (2026-10-12)

Speech that works in silent mode on iPhone and iPad, half the download, updates that arrive sooner, the starter boards in three sizes, and imports tested with real files from other apps. Still not reviewed by speech-language pathologists or tested with AAC users; see the [README](README.md).

### Communicating

- The starter boards come in three sizes: small (24 places, the biggest buttons, with the other words one tap away under More words), medium (48, as before) and large (84, with 35 more core words and an Animals topic), in English and Spanish. Each word stays in the same part of the screen in every size. Choose one in Settings → Boards & backup when starting over. People gains "who".
- A short getting-started guide opens on the first launch, for the adult setting Any AAC up: talking with the board, holding Edit to change words, the voice, and backups. Settings → About opens it again.

### Speech

- App voices are now the default, so speech works in silent mode on iPhone and iPad. The voice for the language in use downloads in the background the first time the app opens (a setting turns this off).
- Every starter word and quick phrase is bundled as audio (0.8 MB), so it speaks from the first tap, offline, before the voice has downloaded.
- The voice download is about half the size: voices are stored in half precision and sound the same (Linda is 32.5 MB instead of 63.5 MB), and eSpeak's data is trimmed to English and Spanish (0.5 MB instead of 9 MB). Voices already downloaded keep working.
- On iPhone and iPad, Settings and edit mode explain that the device voice can't be heard in silent mode, and offer an app voice, which can.
- App voices ask iOS for playback audio before their audio starts, so they speak in silent mode from the first word.
- Fixed: on iPhone and iPad, words tapped before anything else had spoken were silent. iOS only starts speech from the end of a tap, so the first word is now said from there.
- Fixed: the device voice on iPhone and iPad said "capital I" for the word "I". A capital letter on its own is now passed to the voice in lower case.
- Fixed: after the app had prepared about 80 words, sentences and typed text fell back to the device voice. The phonemizer stopped working after that many calls; it's now renewed before then.

### Boards and files

- Imports are tested with files Cboard's and CoughDrop's own exporters made. Pictures that are only links to Mulberry symbols online now come from Any AAC's own library and work offline; pictures linked from other sites aren't loaded (the buttons show their words, and the import says how many). Folder buttons whose board isn't in the file become words instead of doing nothing. Repeated import notices are said once, and an empty file says it has no boards.

### Updates, hosting and privacy

- Updates arrive sooner. The app looks for a new version whenever it comes back on screen, and installs it when it's put away with nothing in the message, instead of waiting until every copy is closed (which an app on the Home Screen rarely is). Edit mode and Settings → About say when one is ready, with **Update now**.
- Any AAC now lives at [any-aac.com](https://any-aac.com/). The old address redirects there; boards saved at the old address need a backup and restore to move.
- A security policy makes the browser refuse scripts, styles and requests from other sites, so the app can only contact its own site. any-aac.com also sends it as a header, with others that stop it being shown inside other sites.
- Links to Any AAC show a preview card when shared.
- Self-hosting: `self-host-voices.mjs` now stores the voices in half precision (148 MB instead of 282 MB), checked against hashes in `voices.json`, in the site's `voices/fp16/` folder. Every page carries the security policy; `node apps/web/security-headers.ts` prints the headers to send as well ([README](README.md#self-hosting)).

## 0.1.0 (2026-10-11)

The first release. Not yet reviewed by speech-language pathologists or tested with AAC users; see the [README](README.md).

Developed as Open AAC, and renamed Any AAC before release ([decision 0011](docs/research/decisions/0011-name.md)). Boards, backups and settings from before the rename still load.

### Communicating

- Word boards with a message bar: tap words to build a message, then Speak. Delete, Clear and Share.
- Starter boards in English (core words from Universal Core, with Spanish translations) and Spanish (words chosen in Spanish, after Soto and Cooper, 2021), each with six topic boards and quick phrases.
- Core words keep their place on every topic board. Word types are coloured and run left to right in sentence order.
- A smaller board for phones, with the words in the same order. It can be turned off.
- One-tap switching between English and Spanish, for bilingual communicators.
- A Forms button that changes the last word to another form, in English and Spanish.
- A Help button on every board that asks for help aloud.

### Speech

- The device's own voices, with rate, pitch and volume.
- App voices that come with Any AAC, run on the device and work offline: Linda (recommended), Kristin, Norman and Cori in English, and Carlfm in Spanish. Every word's audio is prepared ahead, so taps play in about 20–45 ms.
- A pronunciation dictionary.
- Only voices with clearly open licences are offered.

### Access

- Touch settings: hold to select, select on release, ignore repeat taps.
- Switch scanning with one or two switches (keys, game controllers, tap anywhere or mouse buttons): automatic, step and hold-to-move; rows, columns or one at a time; auditory scanning.
- Light, Dark and High contrast themes; label size and position; button spacing; text-only boards.
- Checked against WCAG 2.2 AA with axe-core, and every control on the communication screen is at least 44 px.

### Editing and teaching

- Edit in place, behind a press-and-hold on Edit: labels in each language, spoken text, symbols (the Mulberry library or a photo), word type, links to boards, hide, lock position, copy, swap, undo and redo, new boards, grid size.
- Modeling mode: partners' taps are said but not added to the message. Find a word shows the steps to any word.
- Print boards to PDF.

### Data

- Everything is stored on the device. Nothing is collected or sent anywhere.
- Open Board Format (OBF and OBZ) import and export.
- One-file backups of every board, picture and setting, with a reminder when the boards have changed.
- Works offline once installed. Updates take effect the next time the app is opened, never mid-sentence.
- Hosted on GitHub Pages, with the voices served from the same site. Self-hosting is documented in the README.
