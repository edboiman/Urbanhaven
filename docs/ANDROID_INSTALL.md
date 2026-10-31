# Putting Urban Haven on an Android phone

Plain-language steps. You need the web address (link) of your published Urban Haven — for example `https://YOUR-NAME.github.io/urban-haven/`. If you haven't published it yet, see “Publish” in `README.md` or ask whoever set it up for the link.

**Time:** about 10 minutes on Wi-Fi. **Space:** about 6 MB for the app, plus under 0.2 MB per map region and whatever PDFs you add.

## 1. Open it and let it download

1. Open **Chrome** on the phone (other browsers may not keep offline files as reliably).
2. Type or paste the link. The address must start with **https://**. Opening a downloaded `index.html` file from your Files app will **not** work.
3. Tap **More → Offline setup** (or the small “Check offline setup” badge at the top).
4. Tap **Download & verify** and wait until it says **“verified on this device”** and shows something like `214 / 214 files checked`.
5. Tap **Request persistent storage**. If Chrome says no, that's common — it just means Android *might* clear the app if the phone runs very low on space. Keep backups (step 5).

## 2. Install it like an app

1. In Chrome, tap the **⋮ menu** → **Add to home screen** → **Install** (some phones say **Install app**).
2. Open Urban Haven from the new home-screen icon from now on.

## 3. Download map detail for your area (optional, recommended)

1. Open **Map**. The statewide map is already on your phone.
2. Scroll to **Regional detail packs**. Tap **Download** for the regions you care about (Upper Peninsula, Northern Lower, Southern Lower). Each is tiny (under 50 KB).
3. Wait for **“Installed · verified”**. If the connection drops, tap **Resume** later — finished parts are kept.
4. Add your **markers**: family meeting places, relatives' homes, where your supplies are. Tap **Place on map**, or **At map center / by coordinates** to type coordinates.

The map shows towns, highways, lakes and counties. It is **not** a street map and does not show closures or whether any place is open.

## 4. Test it with no internet (important)

1. Turn on **Airplane mode**.
2. Swipe the app away completely (close it), then open it again from the icon.
3. Check that these work: **Today**, **Checklist**, **Water**, **Map** (search a town, open a marker), **Meals**, **Garden**, a **Field guide** article, and **Documents → Read here**.
4. **Restart the phone** (still in airplane mode) and check again.
5. Turn airplane mode off when done.

If anything says files are missing or damaged: reconnect to Wi-Fi, open **Offline setup**, tap **Download & verify**.

## 5. Make a backup and keep it somewhere else

1. **Settings & backups → Export backup.** This saves a `.json` file to Downloads.
2. Copy that file off the phone (email it to yourself, put it on a USB stick or another phone). The backup is **not encrypted** — treat it like a paper copy of your plans.
3. Tick **Include sensitive notebook entries** only if you want those notes in the file.

**Not in the backup:** imported PDFs (save each from **Documents** with the download icon) and map packs (just download them again on the new phone). Map markers **are** in the backup.

**Restoring on another phone:** install Urban Haven there (steps 1–2), then **Settings & backups → Choose JSON backup → Merge this backup.** Older Urban Haven 1.0 backups work too.

## 6. Keep it working

* When a **“A new edition is downloaded and verified”** bar appears, tap **Update & reload** when convenient. Your records stay. Make a fresh backup now and then.
* Don't use Chrome's **Clear browsing data / Clear site data** for this site — that deletes the app *and* your records.
* Keep some free storage on the phone.
* The app shows reminders (test smoke alarms, rotate water, garden tasks) **only when you open it** — there are no notifications.
* GPS is optional. The app asks for location only when you tap the **target** button on the map, and it does not save your location unless you save a marker.

## What still needs a real phone test

This release was tested in desktop Chromium with phone-size screens and simulated touch, including offline restarts and updates. It has **not** been tested on a physical Android phone. Before you rely on it, please do steps 4 and 5 on your own phone. Things only a real device can confirm: the install prompt wording, airplane-mode restart, phone reboot, low-storage behavior, file pickers for backups/PDFs, GPS, and how the map feels with your fingers.
