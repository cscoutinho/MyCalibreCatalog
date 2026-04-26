<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1S0mdNF4CGAChlyhGGeyeqV_qYjFmyDxU

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy (GitHub Pages)

This repository is configured to deploy automatically to GitHub Pages via GitHub Actions.

1. In GitHub, go to **Settings > Secrets and variables > Actions**.
2. Add a repository secret named `GEMINI_API_KEY`.
3. In **Settings > Pages**, set **Source** to **GitHub Actions**.
4. Push to the `main` branch.

After the workflow completes, your app will be available at:

`https://cscoutinho.github.io/MyCalibreCatalog/`
