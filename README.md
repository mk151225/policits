# Election Campaign Assistant (Tamil Nadu) - Flask Version

A modern, AI-powered election assistant that identifies parties by symbols, slogans, and candidates. Now powered by **Flask (Python)** for maximum stability and easy deployment.

## 🚀 Quick Start (Local)

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**:
   ```bash
   python app.py
   ```

3. **Open the App**:
   Visit `http://localhost:5000`.

---

## ☁️ How to Host on Render.com

This project is pre-configured for **Render Web Services** using Python.

1. **Push to GitHub**: Push your local repository to a new GitHub repo.
2. **Create New Web Service**:
   - Go to [dashboard.render.com](https://dashboard.render.com).
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
3. **Configuration**:
   - Render will automatically detect the settings from `render.yaml`.
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. **Deploy**: Click **Deploy Web Service**.

---

## 📱 "App from Web URL" (PWA Installation)

Once hosted, you can install the app on your phone or desktop:
1. Open the URL in Chrome/Edge.
2. Select **"Install App"** or **"Add to Home Screen"**.

---

## 📊 Managing Data

- **Location**: `static/data/parties.json`
- **How to Update**: Edit this JSON file to update slogans, symbols, or candidates without changing any code.

---

## 🧪 Tech Stack

- **Backend**: Python + Flask
- **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript
- **Deployment**: Render.com (Gunicorn)
- **Voice**: Web Speech API
