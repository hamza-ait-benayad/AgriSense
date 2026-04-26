# AgriSense 🌱💧

## Smart Irrigation System for Small Farmers

AgriSense is a Smart Irrigation-as-a-Service (IoT + Web Platform) project designed to help small and medium farmers optimize water usage, reduce crop loss, and improve irrigation decisions using real-time soil monitoring and smart irrigation control.

This project is developed as an MVP (Minimum Viable Product) by a team of 3 students from different specializations:

* **Software Engineering (Ingénierie Logicielle)**
* **Data Analytics & Artificial Intelligence (Analytique des Données et IA)**
* **Embedded Systems Engineering (Ingénierie Informatique et Systèmes Embarqués)**

The goal is to build a realistic startup-oriented solution adapted to agricultural challenges in Morocco and Africa, especially water scarcity and inefficient irrigation management.

---

# Problem Statement

Many farmers still irrigate manually without real-time data.

This causes:

* Water waste due to over-irrigation
* Crop damage due to under-irrigation
* High operational costs
* Low agricultural productivity
* Poor decision-making due to lack of monitoring tools

In agricultural regions such as Souss-Massa, where water scarcity is a major issue, smart irrigation becomes a critical necessity.

---

# Solution Overview

AgriSense provides a complete smart irrigation system that combines:

* Real-time soil moisture monitoring
* Irrigation ON/OFF remote control
* Basic irrigation recommendations
* Data visualization through a web dashboard
* Future-ready architecture for AI automation

The system combines three main parts:

1. Web Platform (Dashboard + Backend)
2. Artificial Intelligence Logic
3. IoT Sensors and Hardware Control

---

# MVP Features

## Included in the First Version (MVP)

### 1. Soil Moisture Monitoring

Read and display real-time soil moisture data from the field.

### 2. Irrigation Control

Allow farmers to manually activate or stop irrigation remotely using the dashboard.

### 3. Recommendation System

Simple rule-based recommendation:

* If soil moisture < threshold → Irrigate
* Else → No need

### 4. Data Storage

Save:

* Sensor values
* Irrigation history
* Timestamps

### 5. Simple Dashboard

A farmer-friendly interface to monitor irrigation easily.

---

# Technology Stack

---

# Backend + Frontend (Software)

* Python
* Django (Full-stack Framework)
* SQLite Database
* Django Templates
* Tailwind CSS (optional)

---

# AI / Data

* Python
* Pandas
* NumPy
* Scikit-learn (future phase)
* OpenWeather API (future improvement)

---

# Embedded Systems

* ESP32
* Soil Moisture Sensor
* Relay Module
* Water Pump / Solenoid Valve
* DHT11 / DHT22 (optional)
* WiFi Communication
* HTTP Requests

---

# Project Architecture

```text
Soil Sensor
   ↓
ESP32
   ↓ HTTP
Django Backend
   ↓
SQLite Database
   ↓
Dashboard (Web Interface)
   ↓
Farmer Controls Irrigation
   ↓
Command Sent to ESP32
   ↓
Relay Activates Pump
```

---

# Team Responsibilities

---

# 1. Software Engineering 👨‍💻

## Main Mission

Build the web platform and connect the entire system.

This includes:

* Backend development
* Frontend dashboard
* Database management
* API communication
* Integration with ESP32
* Displaying AI recommendations

---

## Detailed Responsibilities

---

## Backend Development (Django)

### Create Django Project Structure

Recommended apps:

* sensors
* irrigation
* dashboard
* users (optional)

---

## Create Models

Examples:

### SensorData Model

Stores:

* moisture value
* optional temperature
* timestamp

### Irrigation Model

Stores:

* irrigation status (ON / OFF)
* last update time

---

## Build API Endpoints

### Required Endpoints

### POST /api/sensor-data/

Receive sensor values from ESP32

### GET /api/sensor-data/

Return latest sensor values

### POST /api/irrigation/

Change irrigation status

### GET /api/irrigation/

Return current irrigation status

### GET /api/recommendation/

Return irrigation recommendation

---

## Frontend Development

### Build Dashboard Page

Display:

* Soil moisture value
* Irrigation status
* Recommendation
* Irrigation ON/OFF button
* Simple history (optional)

---

## UI Goals

The interface must be:

* Simple
* Clean
* Mobile-friendly
* Easy for farmers to understand

---

## Integration

Connect:

Frontend ↔ Backend ↔ Database ↔ ESP32

This is one of the most important parts of the project.

---

## Final Deliverables

* Functional Django application
* Working dashboard
* SQLite database
* Connected APIs
* Successful ESP32 integration

---

# 2. Data Analytics & Artificial Intelligence 🤖

## Main Mission

Create the intelligence that helps farmers decide when irrigation is needed.

For MVP, this starts with rule-based logic, then can evolve into machine learning later.

---

## Detailed Responsibilities

---

## Phase 1 — MVP Rule-Based Recommendation

### Create Recommendation Logic

Example:

```python
if soil_moisture < 30:
    action = "Irrigate"
else:
    action = "No need"
```

This is enough for the MVP.

The goal is to provide simple, reliable recommendations based on moisture values.

---

## Data Collection and Organization

Store and structure:

* Soil moisture
* Temperature
* Date and time
* Irrigation history
* Crop type (future phase)
* Weather conditions (future phase)

This data becomes important for future AI models.

---

## Phase 2 — Optional Machine Learning Improvement

If time allows:

### Build a Simple Prediction Model

Predict:

* irrigation timing
* water needs
* future moisture behavior

Possible algorithms:

* Linear Regression
* Decision Trees
* Classification Models

---

## Weather API Integration (Optional)

Use weather APIs to include:

* Rain prediction
* Temperature
* Humidity

This improves recommendation quality.

---

## Final Deliverables

* Rule-based recommendation system
* Python logic integrated with Django
* Structured data documentation
* Optional simple ML prototype

---

# 3. Embedded Systems Engineering 🔌

## Main Mission

Build the physical smart irrigation system.

This is the real hardware part of the project.

Without Embedded Systems, the project remains only a software simulation.

---

## Detailed Responsibilities

---

## Hardware Selection

### Mandatory Components

* ESP32 (main microcontroller with WiFi)
* Soil Moisture Sensor
* Relay Module

### Optional Components

* DHT11 / DHT22 (temperature + humidity sensor)
* Water Pump
* Solenoid Valve
* LCD Display
* Power Supply Module
* Breadboard + jumper wires

---

## Circuit Design

### Objective

Create the physical electronic circuit.

### Connection Example

```text
Soil Moisture Sensor → ESP32

ESP32 → Relay Module

Relay Module → Water Pump / Valve

ESP32 → WiFi → Django Server
```

### Important Requirements

The student must ensure:

* Stable connections
* Correct voltage levels
* Safe relay usage
* Proper power supply

This is very important for the final demo.

---

## ESP32 Programming

## Main Tasks

---

### A. Read Sensor Values

Example:

```cpp
int moisture = analogRead(sensorPin);
```

The system must read:

* soil moisture
* optional temperature

---

### B. Send Data to Django Backend

Using HTTP POST request:

```http
POST /api/sensor-data/
{
  "moisture": 28
}
```

The ESP32 sends data periodically every few seconds.

---

### C. Receive Irrigation Commands

The ESP32 checks the backend for irrigation status.

Example:

```http
GET /api/irrigation/
```

Response:

```json
{
  "status": "ON"
}
```

---

### D. Execute Irrigation Action

If status = ON

→ activate relay
→ start water pump

If status = OFF

→ deactivate relay
→ stop irrigation

---

## Sensor Calibration

## Objective

Ensure sensor values are accurate.

### Why This Is Important

Incorrect values lead to:

* wrong recommendations
* water waste
* poor irrigation decisions

### Example Thresholds

```text
0–30% → Dry → Irrigate

30–70% → Normal

70–100% → Wet → Stop
```

Calibration is a critical step.

---

## Testing and Integration

### Must Test

* Sensor reading works
* API communication works
* Relay works correctly
* Dashboard receives real values
* Irrigation ON/OFF works from dashboard

This phase is essential.

---

## Final Deliverables

* Complete working circuit
* ESP32 source code
* Connected sensors
* Relay control working
* Successful communication with Django
* Real working prototype for presentation

---

# System Workflow

1. Soil sensor reads moisture

2. ESP32 sends data to Django

3. Django stores data in SQLite

4. AI system generates recommendation

5. Dashboard displays the information

6. Farmer clicks ON/OFF irrigation

7. Django updates irrigation status

8. ESP32 activates or stops irrigation

---

# Business Model

AgriSense can evolve into a real startup.

---

## Revenue Sources

### 1. Hardware Kit Sales

Selling:

* ESP32
* Sensors
* Relay system
* Pump control kit

---

### 2. Monthly Subscription

Access to:

* Dashboard
* Monitoring system
* Irrigation recommendations
* Farm management tools

---

### 3. Agricultural Cooperative Partnerships

Working with:

* Farms
* Agricultural cooperatives
* NGOs
* Local agricultural institutions

---

# Future Improvements

After MVP:

* Fully automatic irrigation
* Machine Learning predictions
* Weather API integration
* Mobile application
* Multi-farm management
* Smart alerts (SMS / WhatsApp)
* Solar-powered irrigation systems
* Government and cooperative partnerships

---

# Development Roadmap

---

# Week 1

* Django project setup
* Database models
* Basic API creation
* ESP32 sensor reading

---

# Week 2

* Dashboard development
* Irrigation ON/OFF control
* Backend ↔ ESP32 integration

---

# Week 3

* Testing and debugging
* UI improvements
* Calibration
* Final demonstration preparation

---

# Project Goal

The objective is not only academic.

The goal is to build:

A real startup idea
+
A working technical prototype
+
A strong entrepreneurial project

that solves a real agricultural problem.

---

# Final Note

For presentation and jury evaluation, the most important thing is not complexity.

It is:

A complete working system.

Even a simple MVP with a real demonstration is much stronger than a complex unfinished project.

Focus on:

Build → Test → Demonstrate

not

Build → Build → Build → Never Finish

---

# AgriSense Team 🚀

Smart Agriculture for a Better Future
