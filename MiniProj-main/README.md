# Ceres

Ceres (formerly KisanSahayak) is an agricultural field-health application for crop disease identification, regional crop and disease analysis, field history, soil-data exploration, and a farmer marketplace. The repository contains a React web application, an Express API, a Python machine-learning service, and a separate Expo/React Native client.

This README describes the implementation currently in this repository. Weather and geolocation depend on external providers; district rainfall/soil data is a bundled dataset, not a live sensor feed. Soil irrigation guidance is rule-based and is not a trained irrigation model.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Technology stack](#technology-stack)
- [Repository layout](#repository-layout)
- [How the main flows work](#how-the-main-flows-work)
- [Requirements](#requirements)
- [Run locally](#run-locally)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Data, models, and external services](#data-models-and-external-services)
- [Validation and troubleshooting](#validation-and-troubleshooting)
- [Security and deployment notes](#security-and-deployment-notes)
- [License](#license)

## Features

- **Crop image assessment:** Upload or capture leaf images. The Python service selects the sharpest image when multiple images are supplied, classifies the crop and disease, and returns matching advice from the recommendations dataset.
- **History and analytics:** Authenticated users can view their saved assessments and personalized disease/pesticide frequency summaries.
- **Regional analysis:** Browse districts and request crop/disease recommendations using rainfall, soil, temperature, and humidity inputs.
- **Live weather overview:** The web dashboard requests current temperature and relative humidity from Open-Meteo using an IP-derived location. It does not represent readings from a farm sensor.
- **Soil Analyzer and irrigation guidance:** Parse CSV, XLSX, or JSON datasets in the browser and display recognized readings. The irrigation baseline is rule-based, requires suitable measurements and crop information, and does not estimate irrigation volume.
- **Marketplace:** Browse listings, sell items, view orders, and initiate checkout. Stripe is optional; without Stripe configured, the backend uses its local checkout flow.
- **Farmer assistant:** A Gemini-backed chat endpoint is available when a server-side Gemini API key is configured.
- **Farm profile and plots:** Maintain a farmer profile, preferred language, plots, crop details, and an active plot.
- **Crop planning and field tasks:** Review crop calendars, add/toggle daily tasks, and use planning tools.
- **Yield and harvest estimates:** Estimate yield and simulate harvest outcomes from crop, area, season, soil, and regional benchmark inputs. These are heuristic estimates, not trained forecasts or guarantees.
- **Mandi tracker:** Filter mandi price records and manage a personal crop/state watchlist. The API attempts to retrieve Agmarknet data and can fall back to a bundled benchmark list; check the displayed data source and date before making decisions.
- **Field intelligence and IoT:** View readings in simulated-demo, manual-entry, or hardware modes. Simulated readings are explicitly demonstration data; a hardware reading is only available when a sensor webhook has provided one.
- **Multilingual assistant experience:** The assistant page offers language selection and localized prompts; the Gemini service is instructed to answer in the language used by the farmer.
- **Contributor workflows:** Enrolled/elevated users can work with image and metadata records through protected API routes.
- **Mobile client:** A separate Expo app provides authentication, crop image workflows, history, regional dashboards, and marketplace screens.

## Architecture

```text
┌────────────────────────┐        HTTP / JSON         ┌────────────────────────┐
│ React web client       │ ─────────────────────────▶ │ Express API             │
│ frontend/              │                            │ backend/                │
│ Vite, React Router     │ ◀───────────────────────── │ auth, marketplace,      │
│ Redux, charts, farm    │                            │ farm, mandi, IoT,      │
│ context                │                            │ intelligence, etc.     │
└───────────┬────────────┘                            └───────┬─────────┬──────┘
            │                                                 │         │
            │ Open-Meteo / IP geolocation                    │         │
            ▼                                                 ▼         ▼
      External APIs                                  JSON file DB    ML service
                                                    + file cache   FastAPI :8000
                                                                      │
                                                                      ▼
                                                           Hugging Face ViT
                                                           and local models

   Express API ───▶ Agmarknet / data.gov.in (mandi prices)
       │
       └──────────▶ Gemini (optional assistant)

┌────────────────────────┐        HTTP / JSON         ┌────────────────────────┐
│ Expo / React Native    │ ─────────────────────────▶ │ Express API             │
│ android/frontend/      │                            │ (configure API URL)     │
└────────────────────────┘                            └────────────────────────┘
```

### Responsibilities

1. **Web and mobile clients** render screens, collect user input, and call the API. The web client is under `frontend/`; the mobile client is a distinct app under `android/frontend/`.
2. **Express API** serves `/api/v1` routes, checks authentication for protected operations, coordinates prediction and analytics requests, stores user-facing records, and serves uploaded images from `/uploads`.
3. **Python ML service** exposes prediction and analysis endpoints. The Express server attempts to launch it locally at `127.0.0.1:8000` when the backend starts.
4. **Local persistence** is implemented by JSON-file-backed model helpers. `backend/db/database.json` stores application records, and `backend/db/cache.json` provides a file-backed cache compatible with the API expected by the app. These files are local development/demo storage, not a production database.
5. **Farm and intelligence APIs** provide farm/plot management, benchmark-based yield/harvest estimation, crop calendars, and farmer task lists.
6. **Mandi and IoT APIs** retrieve mandi prices with a bundled fallback and serve hardware, manual, or clearly labeled simulated field readings. Some IoT state is in-memory and is not durable across backend restarts.
7. **External providers** supply live weather/location and optional Agmarknet, Gemini, Stripe, and Sentry integrations. Their availability and credentials are independent of the local ML models.

## Technology stack

| Area | Technologies |
|---|---|
| Web UI | JavaScript, React 18, Vite 6, React Router, Redux Toolkit, Tailwind CSS, Material UI, GSAP, Chart.js |
| API | Node.js, Express 4, ES modules, JWT (`jose`), `bcryptjs`, Helmet, CORS, Morgan |
| ML / data | Python, FastAPI, Uvicorn, PyTorch, Hugging Face Transformers, Pillow, NumPy, pandas, scikit-learn-compatible serialized models |
| Mobile | React Native 0.74, Expo SDK 51, TypeScript, React Navigation, Redux Toolkit |
| Local storage | JSON files for application data and cache; local filesystem for uploaded images |
| Optional services | Open-Meteo, IP geolocation providers, Google Gemini, Stripe, Sentry |

Dependency manifests are in `frontend/package.json`, `backend/package.json`, `android/frontend/package.json`, and `ML/requirements.txt`.

## Repository layout

```text
MiniProj-main/
├── frontend/                 React + Vite web client
│   └── src/
│       ├── components/       Shared UI, navigation, charts, chat
│       ├── context/          Authentication and user contexts
│       ├── hooks/            API and stateful feature hooks
│       ├── pages/            Home, farm, crop planning, field intelligence,
│       │                     assistant, mandi, upload, dashboard, marketplace
│       ├── context/          Authentication and farm-profile context
│       ├── data/             Bundled regional rainfall/soil dataset
│       └── utils/            Weather, parsing, and other client utilities
├── backend/                  Express API
│   ├── controllers/          Request handling and business logic
│   ├── routes/               Auth, farm, intelligence, IoT, mandi, and API routes
│   ├── middlewares/          Authentication and role checks
│   ├── models/               JSON-backed model interfaces
│   ├── db/                   Local JSON data and cache files
│   ├── uploads/              Locally uploaded images
│   └── index.js              API startup and ML-service launcher
├── ML/                       FastAPI service, model code and model artifacts
├── android/frontend/         Expo / React Native client
├── backdoors/                Standalone data utility scripts
├── LICENSE                   Apache License 2.0
└── README.md
```

## How the main flows work

### Crop image assessment

1. The client uploads an image to the backend and receives a URL for the locally stored file.
2. The authenticated client submits the image URL(s) and field metadata to `POST /api/v1/predictions/upload`.
3. Express forwards the request to the Python service at `POST /predict`.
4. The Python service selects the sharpest provided image (when there are multiple), runs the ViT image classifier, and resolves disease information and recommendations from `ML/recommendations.json`.
5. Express saves the prediction in the local JSON database. User history is cached and invalidated as needed.

### Crop and disease analytics

Regional/personal analytics send environmental inputs to the Express dashboard routes. The API calls the Python `/analysis` endpoint and returns model output. The backend also has a simple rule-based fallback for this analytics flow if the ML service cannot answer; that fallback should not be confused with the image classifier.

### Farm, planning, and field intelligence

The authenticated farm API stores a profile and plot details in the local JSON database. Crop planning combines crop calendars and user-entered plot information with yield/harvest estimates calculated by backend benchmark formulas. These figures are indicative planning aids, not predictions from the image-classification model. Daily tasks are stored per user.

The IoT readings API supports simulated demonstration values, user-entered manual readings, and readings received through a hardware webhook. The simulated mode is not connected to a physical sensor. The current hardware telemetry and manual-reading stores are held in backend memory, so they are not durable across restarts.

### Mandi prices

The mandi API attempts to fetch records from the Government of India's Agmarknet/data.gov.in API. If that request is unavailable, the backend can return a bundled benchmark list labeled as cached data. A fallback record is not a guaranteed live quote; verify source, date, market, and unit before using a price for a sale decision.

### Weather and regional data

The web overview obtains approximate location through IP-based lookup and requests current temperature/humidity from Open-Meteo. District dashboards use the checked-in `frontend/src/data/Rainfall_Soil.json` dataset for rainfall/soil benchmark fields. This bundled dataset is not a live weather station or soil sensor.

### Soil Analyzer

CSV/XLSX/JSON uploads are parsed in the browser; the file itself is not sent to the backend or saved by the app. The analyzer accepts up to 20 MB and 10,000 rows. It displays recognized fields rather than inventing missing measurements. Irrigation guidance is a transparent FAO-56 depletion-rule baseline with input prerequisites, not an ML forecast or automated irrigation command. See the [FAO-56 reference](https://www.fao.org/4/x0490e/x0490e0e.htm).

## Requirements

- Node.js and npm (Node.js 20 LTS is a practical choice for the Vite and Expo projects).
- Python 3 and pip for the ML service.
- Internet access for dependency downloads and first-time Hugging Face model downloads; the web app also contacts its configured weather/geolocation providers.
- Optional credentials only for integrations you plan to use (Gemini, Stripe, Sentry).
- For mobile development, Expo Go or the relevant Android/iOS development tooling.

## Run locally

Commands below use PowerShell and assume the working directory is the `MiniProj-main` project folder.

### 1. Install and start the ML service and API

Create a Python virtual environment, install the ML requirements, install backend packages, then start the API. The backend tries to start Uvicorn automatically using the active `python` executable.

```powershell
cd .\ML
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

cd ..\backend
npm install
npm start
```

The API listens on `http://localhost:5000` by default, and the ML service listens on `http://127.0.0.1:8000`. The first ML start may download model files from Hugging Face and take several minutes. Keep this terminal open while using the app.

If PowerShell prevents environment activation, either allow activation according to your machine's policy or run the virtual environment's Python executable explicitly when setting up the environment. The backend's auto-launch requires `python` to resolve to an interpreter with the ML dependencies installed.

### 2. Install and start the web client

Open a second terminal:

```powershell
cd .\frontend
npm install
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`. Configure `VITE_API_URL` as described below if it is not already set for your environment.

### 3. Start the mobile client (optional)

Install dependencies and run Expo in a separate terminal:

```powershell
cd .\android\frontend
npm install
npm start
```

Scan the Expo QR code with Expo Go. Set `EXPO_API_URL` in the mobile app's environment configuration to the backend API base URL (`http://<your-computer-LAN-IP>:5000/api/v1` for a physical device). A phone's `localhost` refers to the phone itself, not the development computer. Ensure both devices can reach each other on the network.

## Configuration

Do not commit real API keys, passwords, signing secrets, or production environment files.

### Web client

Set `VITE_API_URL` to the Express API base URL, including `/api/v1`. For local development, create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Restart Vite after changing environment variables. Variables prefixed with `VITE_` are exposed to browser code; never put private credentials in them.

### Backend

Create `backend/.env` for server-side configuration. The following variables are read by the application:

| Variable | Purpose |
|---|---|
| `PORT` | Express listening port; defaults to `5000`. |
| `JWT_SECRET` | Secret used to sign/verify authentication tokens. Set a strong private value; the in-code fallback is for local development only. |
| `ML_URL` | Python ML-service base URL; defaults to `http://127.0.0.1:8000`. |
| `GEMINI_API_KEY` | Enables the Gemini farmer-assistant integration. Keep this on the server. |
| `GEMINI_MODEL` | Optional Gemini model name; the chat route has its own default. |
| `STRIPE_SECRET_KEY` | Enables Stripe checkout. Without it, local checkout mode is used. |
| `BASE_URL` | Frontend origin used to construct payment return URLs; defaults to `http://localhost:5173`. |
| `ADMIN_PASSWORD` | Password expected by the admin-token endpoint. |
| `SENTRY_DSN` | Optional backend Sentry reporting. |

The frontend's optional OpenWeatherMap integration reads `VITE_API_KEY`; that value is a browser-visible key, not a server secret. Current overview weather uses Open-Meteo. IP geolocation and weather data are provided by third parties and can be unavailable or approximate.

### Mobile client

The Expo client reads `EXPO_API_URL` through `react-native-dotenv`. Point it to the same API base URL as the web client, using the development computer's LAN IP when testing on a physical device.

Create `android/frontend/.env` with the reachable API URL, then restart Expo:

```env
EXPO_API_URL=http://192.168.1.25:5000/api/v1
```

Replace the example address with the development computer's LAN IP.

## API overview

The Express API is mounted at `/api/v1`. Protected routes require the authentication token used by the client. This is a feature overview, not a complete request/response schema.

| Prefix | Examples | Purpose |
|---|---|---|
| `/auth` | `POST /register`, `POST /login`, `POST /logout/:id`, `DELETE /delete-account` | Account and session operations |
| `/predictions` | `POST /upload`, `GET /records`, `GET /records/:id`, `GET /history/:id` | Crop assessments and history |
| `/dashboard` | `POST /analysis/:id`, `GET /personalized/:id`, `POST /regional-analysis` | Crop/disease and personal analytics |
| `/farm` | `GET /profile`, `PUT /profile`, `POST /plots`, `PUT /plots/:plotId`, `DELETE /plots/:plotId` | Authenticated farm profile and plot management |
| `/intelligence` | `POST /yield-prediction`, `POST /harvest-simulator`, `GET /fertilizer`, `GET /crop-calendar`, task routes | Benchmark-based planning and daily field tasks |
| `/mandi` | `GET /prices`, `GET /options`, watchlist routes | Mandi price lookup and authenticated watchlist |
| `/iot` | `GET /readings`, `POST /manual`, `POST /webhook` | Simulated/manual/hardware field readings |
| `/marketplace` | `POST /sell`, `GET /explore/:id`, `POST /buy`, `GET /orders/:id` | Listings, buying, and orders |
| `/payment` | `POST /pay` | Checkout initiation |
| `/elevatedUser` | Metadata, image, and record operations | Contributor/elevated-user workflows |
| `/admin` | Admin token and image operations | Administrative operations |
| `/chat` | `POST /` | Gemini-backed assistant (requires `GEMINI_API_KEY`) |

The image upload endpoint is `POST /api/v1/upload-image`; uploaded files are served from `/uploads/<filename>`. The ML service is separate from `/api/v1` and currently exposes `GET /`, `POST /predict`, and `POST /analysis` on port 8000.

## Data, models, and external services

- **Application records:** `backend/db/database.json` is initialized with default collections/sample marketplace and image records when needed. The model helpers read and write this JSON file.
- **Record collections:** The local store has collections for users, deleted users, predictions, products, orders, payments, metadata, and images. Default sample product/image records are supplied for local use.
- **Farm/planning collections:** Farm profiles and plot information are stored in the local database; daily crop tasks and mandi watchlists use their own model collections.
- **Cache:** `backend/db/cache.json` stores cache entries; it is a local-file fallback and does not require a Redis server.
- **IoT state:** Manual readings and latest hardware telemetry are currently held in process memory; they are not a persistent sensor database.
- **Image uploads:** Stored under `backend/uploads/` and served by Express. Back up or clean this directory according to your local retention needs.
- **Regional dataset:** `frontend/src/data/Rainfall_Soil.json` contains district-level rainfall and soil benchmark data used by the regional UI.
- **Image classifier:** `ML/predict.py` loads a Hugging Face ViT crop-leaf classifier and processor. The first model load requires internet access unless the model is already cached.
- **Structured-data models:** `ML/analysis.py` loads the serialized crop/disease models and encoders in `ML/`. These are model artifacts, not training scripts.
- **Model environment:** Pickle artifacts must be loaded with Python libraries compatible with the versions used to create them. `ML/requirements.txt` lists runtime packages but does not document the full model-training environment or guarantee artifact portability.
- **Recommendations:** Disease explanations, management recommendations, and pesticide names are read from `ML/recommendations.json`.
- **External integrations:** Open-Meteo/IP lookup for weather and location; Agmarknet/data.gov.in for mandi prices (with a labeled bundled fallback); Google Gemini for chat; Stripe for hosted checkout; Sentry for optional error reporting.

## Validation and troubleshooting

Run the web checks from `frontend/`:

```powershell
npm run lint
npm run build
```

There are no test scripts declared in the web or backend `package.json` files. The frontend build/lint commands are the repository's available standard checks for those projects.

| Symptom | Checks |
|---|---|
| Web requests fail | Confirm the API is running, `VITE_API_URL` includes `/api/v1`, and restart Vite after editing env files. |
| Prediction service unavailable | Confirm the Python environment has `ML/requirements.txt` installed, `ML_URL` points to the service, and port `8000` is available. |
| First prediction is slow | The ML service may be downloading the Hugging Face model on first startup. |
| Farmer chat reports setup required | Add `GEMINI_API_KEY` to `backend/.env` and restart the backend. |
| Stripe is disabled | This is expected without `STRIPE_SECRET_KEY`; local checkout mode is used instead. |
| Mandi values appear cached | The live Agmarknet request may be unavailable; verify the data-source/freshness label and confirm prices with the local market. |
| IoT readings are marked simulated/offline | Simulation is demo-only. Hardware mode requires a sensor node to post valid readings to the webhook. |
| Mobile app cannot reach API | Set `EXPO_API_URL` to the computer's LAN IP, not `localhost`, and check firewall/network access. |
| Local records appear reset or missing | Check `backend/db/database.json`, `backend/db/cache.json`, and `backend/uploads/`; these are local persistent files. |

## Security and deployment notes

- The local JSON database and file-backed cache are intended for development/demo use. They do not provide the concurrency, backup, migration, or operational guarantees expected of a production database.
- Configure a strong `JWT_SECRET`; do not rely on the source-code development fallback for a deployed environment.
- Restrict CORS origins, request sizes, secrets, file handling, and admin access before exposing the API publicly. Review the current Express settings and routes for production suitability.
- Keep Gemini and Stripe credentials on the server. Do not commit `.env` files or copy secrets into `VITE_*` variables.
- The repository does not include a production deployment configuration. Production hosting, database selection, model hosting, TLS, backups, observability, and scaling must be configured separately.
- Crop classification and recommendations are decision-support information, not a substitute for local agronomic advice or verified product labels. Validate recommendations for local crops, conditions, and regulations before acting.
- Yield, harvest-impact, and fertilizer outputs are based on application benchmarks/rules; they are not guaranteed outcomes or a replacement for a locally calibrated agronomist recommendation. Mandi fallback prices may be stale, and simulated/manual telemetry is not equivalent to a verified physical sensor measurement.

## License

This project is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
