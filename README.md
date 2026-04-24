# 🧠 FitBrain — AI Personal Trainer

FitBrain is an AI-powered fitness coach that generates a **fully personalised weekly workout plan** based on your goal, fitness level, equipment, and age. Every exercise comes with sets, reps, rest time, and an explanation of why it fits your goal. Not happy with a day? Regenerate just that day without rebuilding the whole plan.

---

## ✨ Features

- 🎯 **Personalised plans** — tailored to your goal (lose weight, build muscle, get fit), fitness level, equipment, and age
- 📅 **Full weekly schedule** — choose 3 to 6 workout days, rest days filled in automatically
- 🔄 **Regenerate any day** — didn't like Tuesday's workout? Refresh just that day
- 💡 **Exercise explanations** — every exercise includes a "why" so you understand what you're training
- ⚡ **Fast** — plans generated in seconds using Llama 3.3 70B via Groq

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI |
| AI Model | Llama 3.3 70B (via Groq API) |
| Data Validation | Pydantic |
| Frontend | HTML, CSS, JavaScript |
| Templating | Jinja2 |
| Server | Uvicorn |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Martin-gif-maker/FitBrain
cd FitBrain
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up your API key

Create a `.env` file in the root folder (see `.env.example`):

```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free API key at [console.groq.com](https://console.groq.com)

### 5. Run the app

```bash
uvicorn main:app --reload
```

Then open your browser and go to: **http://localhost:8000**

---

## 📋 How It Works

1. Fill in your profile — goal, fitness level, equipment, age, and days per week
2. Click **Generate Plan**
3. FitBrain sends your profile to Llama 3.3 70B which returns a structured JSON workout plan
4. Your full weekly schedule is displayed with exercises, sets, reps, and rest times
5. Click **Regenerate** on any day to get a fresh alternative workout for that day

---

## 📁 Project Structure

```
FitBrain/
├── main.py              # FastAPI app — routes and AI logic
├── requirements.txt     # Python dependencies
├── .env.example         # Example environment variables
├── Procfile             # Deployment config
├── static/
│   ├── css/style.css    # Styles
│   └── js/app.js        # Frontend logic
└── templates/
    └── index.html       # Main page
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key (required) |

---

## 📄 License

MIT License — free to use and modify.

---

Made by [Martin Genov](https://github.com/Martin-gif-maker)
