from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)


class UserProfile(BaseModel):
    goal: str           # e.g. "lose weight", "build muscle", "get fit"
    level: str          # "beginner", "intermediate", "advanced"
    equipment: str      # "none", "home", "gym"
    days: int           # days per week (3-6)
    age: int
    notes: str = ""     # any extra info (injuries, preferences)


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")


@app.post("/generate")
async def generate_plan(profile: UserProfile):
    prompt = f"""You are an expert personal trainer. Create a personalized {profile.days}-day weekly workout plan for this person:

- Goal: {profile.goal}
- Fitness level: {profile.level}
- Equipment: {profile.equipment}
- Age: {profile.age}
- Extra notes: {profile.notes if profile.notes else "None"}

Return ONLY a valid JSON object in this exact structure:
{{
  "plan_title": "short catchy title for their plan",
  "plan_description": "2 sentence description of the plan and why it suits their goal",
  "weekly_plan": [
    {{
      "day": "Monday",
      "focus": "e.g. Upper Body / Cardio / Rest",
      "duration_minutes": 45,
      "exercises": [
        {{
          "name": "Exercise name",
          "sets": 3,
          "reps": "10-12",
          "rest_seconds": 60,
          "why": "one sentence explaining why this exercise fits their goal"
        }}
      ]
    }}
  ]
}}

Include exactly {profile.days} workout days and fill the remaining days as rest/active recovery days.
Make it realistic, safe, and tailored to their level and equipment."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.7,
    )

    plan = json.loads(response.choices[0].message.content)
    return JSONResponse(content=plan)


@app.post("/regenerate-day")
async def regenerate_day(data: dict):
    day = data.get("day")
    focus = data.get("focus")
    goal = data.get("goal")
    level = data.get("level")
    equipment = data.get("equipment")

    prompt = f"""You are an expert personal trainer. Generate a single alternative workout day.

- Day: {day}
- Focus: {focus}
- User goal: {goal}
- Fitness level: {level}
- Equipment: {equipment}

Return ONLY a valid JSON object:
{{
  "day": "{day}",
  "focus": "{focus}",
  "duration_minutes": 40,
  "exercises": [
    {{
      "name": "Exercise name",
      "sets": 3,
      "reps": "10-12",
      "rest_seconds": 60,
      "why": "one sentence explaining why this exercise fits their goal"
    }}
  ]
}}

Make it different from a typical workout for this focus. Keep it safe and appropriate for the level."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.9,
    )

    day_plan = json.loads(response.choices[0].message.content)
    return JSONResponse(content=day_plan)
