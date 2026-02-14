from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import os
from datetime import datetime

app = FastAPI(
    title="Fraud Detection API",
    description="API untuk deteksi fraud/kecurangan menggunakan KNN model dan TF-IDF",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
model_loaded = False

def load_models():
    global model, model_loaded
    
    if model_loaded:
        return True
    
    try:
        import joblib
        if not os.path.exists('knn_pipeline.pkl'):
            raise FileNotFoundError("knn_pipeline.pkl not found!")
        
        # Load models
        print("Loading models...")
        model = joblib.load('knn_pipeline.pkl')
        model_loaded = True        
        return True
        
    except Exception as e:
        print(f"Error loading models: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load models: {str(e)}"
        )

# Request/Response Models
class TextInput(BaseModel):
    text: str = Field(..., description="Teks percakapan yang akan diprediksi")

class BatchTextInput(BaseModel):
    texts: List[str] = Field(..., description="List teks untuk prediksi batch")

class PredictionResponse(BaseModel):
    text: str
    prediction: str
    is_fraud: bool
    fraud_probability: float
    label: int
    timestamp: str

class BatchPredictionResponse(BaseModel):
    count: int
    results: List[PredictionResponse]
    timestamp: str

def predict_single_text(text: str) -> dict:
    load_models()

    # Predict
    prediction = model.predict([text])[0]
    proba = model.predict_proba([text])[0]
    
    # Fraud probability
    is_fraud = bool(prediction == 1)
    fraud_prob = float(proba[1]) if len(proba) > 1 else 0.0
    
    return {
        "text": text,
        "prediction": "FRAUD" if is_fraud else "NORMAL",
        "is_fraud": is_fraud,
        "fraud_probability": round(fraud_prob * 100, 2),
        "label": int(prediction),
        "timestamp": datetime.now().isoformat()
    }

# API Endpoints
@app.get("/", tags=["Root"])
def root():
    return {
        "name": "Fraud Detection API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model_loaded,
        "endpoints": {
            "predict": "/predict",
            "batch_predict": "/predict/batch",
            "health": "/health",
            "docs": "/docs"
        }
    }

@app.get("/health", tags=["Health"])
def health_check():
    try:
        load_models()
        return {
            "status": "healthy",
            "model_loaded": model_loaded,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "model_loaded": False
        }

@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict_fraud(input: TextInput):
    try:
        result = predict_single_text(input.text)
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/batch", response_model=BatchPredictionResponse, tags=["Prediction"])
def predict_batch(input: BatchTextInput):
    try:
        results = []
        
        for text in input.texts:
            result = predict_single_text(text)
            results.append(result)
        
        return {
            "count": len(results),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@app.get("/model/info", tags=["Model Info"])
def model_info():
    try:
        load_models()
        knn = model.named_steps.get('knn')
        tfidf = model.named_steps.get('tfidf')

        return {
            "pipeline_type": type(model).__name__,
            "model_type": type(knn).__name__ if knn else None,
            "n_neighbors": knn.n_neighbors if knn else None,
            "metric": knn.metric if knn else None,
            "weights": knn.weights if knn else None,
            "vectorizer_type": type(tfidf).__name__ if tfidf else None,
            "vocabulary_size": len(tfidf.vocabulary_) if hasattr(tfidf, 'vocabulary_') else None,
            "model_loaded": model_loaded
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting model info: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*70)
    print("Starting Fraud Detection API Server")
    print("="*70)
    print("\nServer will be available at:")
    print("   - http://localhost:5000")
    print("\nAPI Documentation:")
    print("   - http://localhost:5000/docs")
    print("\n" + "="*70 + "\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5000,
        log_level="info"
    )