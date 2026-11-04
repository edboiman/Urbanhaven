# Update your existing Urbanhaven repository

This is the full Urban Haven 2.2.0 project. Your repository is still named **Urbanhaven**. The version number identifies the app release; it does not rename the repository.

## 1. Back up your app records

Open your existing app → Settings & backups → Export backup. Keep the JSON somewhere safe. Imported PDFs must be copied separately. Use the same app address and browser after updating; do not clear site data.

## 2. Extract this ZIP into a new folder

Do not upload the ZIP to GitHub and do not create a new repository. Keep the new extracted `urban-haven` folder separate from your existing repository for this step.

Inside the new extracted `urban-haven` folder, right-click an empty space → Open in Terminal. Run:

```bash
bash UPDATE_EXISTING_REPO.sh
```

The helper targets the existing folder you showed earlier:

```
~/Documents/Urban_Haven_v2.0.0/urban-haven
```

It copies the new source files and preserves `.git`, your repository history and remote. It refuses to run if the existing repository contains uncommitted changes. It does not install packages, commit or push.

If your existing repository is somewhere else, pass its real path, for example:

```bash
bash UPDATE_EXISTING_REPO.sh "$HOME/Documents/Urban_Haven_v2.0.0/urban-haven"
```

## 3. Push from your existing repository

Open your **existing** repository folder in Terminal. For the location above:

```bash
cd "$HOME/Documents/Urban_Haven_v2.0.0/urban-haven"
git add .
git commit -m "Simplify Urban Haven checklist and food tools"
git push origin main
```

The commit message is a description of the change; it is not a repository name. Git pushes support more than 100 files, so the website upload limit does not apply. GitHub Actions will install the committed dependency lockfile, check the app, build and deploy using your existing workflow.

## 4. Verify the update on your phone

Wait for **build** and **deploy** to turn green. Check the separate **browser-tests** job as well: its failure does not block deployment, so a green deploy does not certify offline behavior.

Open your usual app. If offered, tap **Update & reload**. Check that your existing supplies and notes are present. Open **Offline setup** and verify the new files. Download / verify the regional map packs you need. Then close the app, enable airplane mode and reopen it.

Also open **Storage & shelf lives** and check Supplies: classify existing water as commercial or self-filled, and classify any saved dates as quality, expiry or review. Old records remain readable; unknown water is not silently assumed self-filled.

Try: create a two-stop path; reopen it; attach a test photo to a marker; choose a crop; open a health guide; save a radio station; save a pet record. Do this before relying on the app in an emergency.

No GitHub push or deployment was performed while preparing this package. See `docs/TEST_RESULTS.md` for checks performed and limits.
