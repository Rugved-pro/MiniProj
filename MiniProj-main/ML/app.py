import os
import urllib.error

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from PIL import UnidentifiedImageError

import predict as pd
import analysis as al
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Image(BaseModel):
    userId: str
    url: list[str]
    location: str
    rainAct: float
    rainNorm: float
    rainDep: float
    soil_N: float
    soil_P: float
    soil_K: float
    soil_pH: float
    temp: float
    hum: float

class Analysis(BaseModel):
    rain: float
    soil_N: float
    soil_P: float
    soil_K: float
    soil_pH: float
    temp: float
    hum: float

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*"    
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "ML Server Up & Running"}

@app.post("/predict")
async def getPrediction(req: Image):
    try:
        best_img_url = pd.get_best_img(req.url)
        crop, attribute, confidence, top3, is_uncertain, sharpness, quality_warning = pd.predict_class(best_img_url)
    except (FileNotFoundError, OSError, UnidentifiedImageError, urllib.error.URLError, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    with open(os.path.join(BASE_DIR, "recommendations.json"), "r", encoding="utf-8") as f:
        recomms_dict = json.load(f)
    dict_key = crop + "___" + attribute
    recommendations = recomms_dict.get(dict_key, {})
    return {
        "userId": req.userId,
        "url": best_img_url,
        "location": req.location,
        "crop": crop,
        "rainAct": req.rainAct,
        "rainNorm": req.rainNorm,
        "rainDep": req.rainDep,
        "soil_N": req.soil_N,
        "soil_K": req.soil_K,
        "soil_P": req.soil_P,
        "soil_pH": req.soil_pH,
        "temp": req.temp,
        "hum": req.hum,
        "disease": attribute,
        "confidence": confidence,
        "top3": top3,
        "is_uncertain": is_uncertain,
        "sharpness": sharpness,
        "quality_warning": quality_warning,
        "disease_details": recommendations.get("disease_details", []) if attribute != "Healthy" else [],
        "recomm": recommendations.get("recommendations", []) if attribute != "Healthy" else [],
        "pesticides": recommendations.get("pesticides", []) if attribute != "Healthy" else []
    }

@app.post('/analysis')
async def getAnalysis(req: Analysis):
    return al.predict_and_save_to_json(
        req.rain,
        req.soil_N,
        req.soil_P,
        req.soil_K,
        req.soil_pH,
        req.temp,
        req.hum
    )
