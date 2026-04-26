
# AgriSense 🌱💧
**Smart Irrigation System for Small Farmers**

AgriSense is a Smart Irrigation-as-a-Service (IoT + Web Platform) project designed to help small and medium farmers optimize water usage, reduce crop loss, and improve irrigation decisions using real-time soil monitoring and smart irrigation control. 

This project was built as a Minimum Viable Product (MVP) for the "Culture Entrepreneuriale" module by a multidisciplinary team of three students:
* **Software Engineering:** Backend architecture, APIs, and Frontend Dashboard.
* **Data Analytics & Artificial Intelligence:** Rule-based AI, Weather API integration, and Data Analytics (Pandas).
* **Embedded Systems Engineering:** ESP32 hardware, soil moisture sensors, and relay control.

---

## 📖 Table of Contents
- [Problem Statement](#-problem-statement)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Installation & Setup](#-installation--setup)
- [Usage & Testing](#-usage--testing)
- [API Documentation](#-api-documentation)

---

## ⚠️ Problem Statement
Many farmers still irrigate manually without real-time data, leading to:
* **Water waste** due to over-irrigation.
* **Crop damage** due to under-irrigation.
* **High operational costs** and poor decision-making.

**The Solution:** AgriSense provides a farmer-friendly dashboard that tracks soil moisture, checks local weather forecasts, and uses AI to recommend (or automatically trigger) irrigation only when it is truly needed.

---

## ✨ Key Features
* **Live Soil Monitoring:** Real-time gauge and interactive historical line charts (Chart.js) showing soil moisture and temperature.
* **Weather-Aware AI Recommendations:** The system checks the **Open-Meteo API** (free weather forecast). If the soil is dry but a rainstorm is coming, the AI smartly advises to `Wait` to save water.
* **Remote Irrigation Control:** Manual ON/OFF override for the water pump directly from the dashboard.
* **Data Analytics:** Automatically calculates 24-hour averages, min/max values, dry reading counts, and moisture trends using `pandas`.
* **Hardware-Ready APIs:** Endpoints ready to receive live HTTP POST requests from physical ESP32 IoT sensors in the field.

---

## 🛠️ Technology Stack
* **Backend:** Python, Django 6.0, Django REST Framework, SQLite.
* **Data & AI:** Pandas (Analytics), Open-Meteo API (Weather data), Python `dotenv`.
* **Frontend:** HTML5, CSS3 (Custom Glassmorphism UI), Vanilla JavaScript, Chart.js.
* **IoT Hardware (MVP Phase):** ESP32 Microcontroller, Soil Moisture Sensor, 5V Relay Module, Water Pump.

---

## 📐 System Architecture

```text
Soil Sensor
   ↓ (Reads Analog Data)
ESP32 Microcontroller
   ↓ (HTTP POST /api/sensor-data/)
Django Backend & SQLite DB
   ↓ (Analyzes Moisture + Fetches Open-Meteo Forecast)
AI Recommendation Logic
   ↓ (Sends JSON to Frontend)
Farmer Dashboard (Web UI)
   ↓ (Farmer clicks ON/OFF)
Django updates Irrigation Status
   ↓ (ESP32 polls /api/irrigation/)
Relay Activates/Deactivates Pump
```

---

## 🚀 Installation & Setup

Follow these steps to run the AgriSense platform locally on your machine.

### 1. Clone the repository
```bash
git clone [<your-repository-url>](https://github.com/hamza-ait-benayad/AgriSense.git)
cd AgriSense
```

### 2. Create a Virtual Environment (Recommended)
```bash
python -m venv venv
```
* **Activate on Windows:** `venv\Scripts\activate`
* **Activate on Mac/Linux:** `source venv/bin/activate`

### 3. Install Dependencies
Install all required Python packages:
```bash
pip install django djangorestframework django-cors-headers pandas requests python-dotenv
```

### 4. Configure Environment Variables
Create a file named `.env` in the root directory (same level as `manage.py`) and add your farm's coordinates:
```env
# Farm GPS Coordinates (Default: Agadir region)
FARM_LAT="30.4278"
FARM_LON="-9.5981"

# Weather Simulation (Set to "true" for jury demonstrations to force the "Wait" scenario)
USE_MOCK_WEATHER="false"
MOCK_RAIN="false"
```

### 5. Setup the Database
Run the migrations to create the SQLite database tables:
```bash
python manage.py migrate
```

### 6. Seed the Database
Run the custom seed command to create the default Admin user and the initial Irrigation Status state:
```bash
python manage.py seed_db
```
*(This creates a superuser with Username: `admin`, Password: `admin123`)*

### 7. Start the Development Server
```bash
python manage.py runserver
```
The application will now be running at `http://127.0.0.1:8000/`.

---

## 🕹️ Usage & Testing

### Access the Dashboard
Open your browser and navigate to: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### Simulating Sensor Data (Without Hardware)
If the physical ESP32 is not connected yet, you can simulate hardware data directly from the dashboard:
1. Scroll down to the **"ESP32 Sensor Simulation"** section.
2. Click **"Simulate Dry Soil (Low)"** — The gauge will drop below 40%, and the AI will recommend `💧 Irrigate`.
3. Click **"Simulate Wet Soil (High)"** — The AI will update to `✅ No Need`.
4. **To test the weather-aware AI for your presentation:** Stop the server, change `USE_MOCK_WEATHER="true"` and `MOCK_RAIN="true"` in your `.env` file, restart the server, and simulate dry soil. The AI will output `⏳ Wait` because a simulated storm is coming.

### External Hardware Simulator
You can also run the Python simulator script in a separate terminal to automatically send data every 5 seconds:
```bash
python simulator.py
```

### Admin Panel
Manage raw database entries by logging into the Django admin panel:
* **URL:** `http://127.0.0.1:8000/admin/`
* **Credentials:** `admin` / `admin123`

---

## 📡 API Documentation

The backend provides several RESTful endpoints for the IoT hardware and frontend to communicate.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/sensor-data/` | `GET` | Retrieve the last 20 sensor readings. |
| `/api/sensor-data/` | `POST` | Submit a new sensor reading (Used by ESP32). Requires payload: `{"moisture": 45.0, "temperature": 22.5}`. |
| `/api/sensor-data/latest/`| `GET` | Get only the most recent sensor reading. |
| `/api/irrigation/` | `GET` | Get the current status of the water pump (`ON` or `OFF`). ESP32 polls this to trigger the relay. |
| `/api/irrigation/` | `POST` | Update pump status. Requires payload: `{"status": "ON"}`. |
| `/api/recommendation/` | `GET` | Returns AI decision (`Irrigate`, `No Need`, or `Wait`), plus the weather context. |
| `/api/recommendation/analytics/`| `GET` | Returns Pandas-calculated statistics (averages, trends, min/max) for the last 24 hours. |

---
*Developed with ❤️ and lots of ☕*
