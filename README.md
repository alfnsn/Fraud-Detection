# 🚀 Fraud Detection API - Local Deployment

API untuk deteksi fraud/kecurangan menggunakan KNN model dan TF-IDF dengan FastAPI.

---

## 📁 File Structure

```
FRAUD DETECTION/
│
├── app.py
├── knn_pipeline.pkl
├── requirements.txt
├── Fraud Detection Training.ipynb
├── fraud_dataset_new.csv
└── README.md
```

---

## 🔧 Setup & Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Atau install manual:

```bash
pip install fastapi uvicorn scikit-learn joblib pydantic 
```

### 2. Menjalankan API

```bash
python main.py
```

Atau 
```bash
uvicorn main:app --reload --port 5000
```

Server akan berjalan di:
```bash
http://localhost:5000
```


### 3. Dokumentasi API (Swagger)
Buka di browser:
```bash
http://localhost:5000/docs
```

Di sana bisa langsung test endpoint.

---

### 4. Endpoint

#### 1. GET /
Cek apakah API berjalan.

#### 2. GET /health
Cek apakah model berhasil dimuat.

#### 3. POST /predict
Prediksi satu teks.

Request:
```bash
{
  "text": "kontak via aplikasi pribadi untuk proses pencairan dana"
}
```

Response:
```bash
{
  "text": "...",
  "prediction": "FRAUD",
  "is_fraud": true,
  "fraud_probability": 85.5,
  "label": 1,
  "timestamp": "2026-02-13T23:49:46"
}
```

#### 4. POST /predict/batch
Prediksi beberapa teks sekaligus.

Request:
```bash
{
  "texts": [
    "transfer dana tanpa prosedur resmi",
    "rapat evaluasi kinerja besok pagi"
  ]
}

```

Response:
```bash
{
  "text": "...",
  "prediction": "FRAUD",
  "is_fraud": true,
  "fraud_probability": 85.5,
  "label": 1,
  "timestamp": "2026-02-13T23:49:46"
}
```

### 5. Model
• Vectorizer: TfidfVectorizer
• Classifier: KNeighborsClassifier
• Training menggunakan GridSearchCV
• Pipeline disimpan sebagai knn_pipeline.pkl