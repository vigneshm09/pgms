# Backend Setup

## Run locally

1. Create a virtual environment.
2. Install packages with `pip install -r requirements.txt`.
3. Copy `.env.example` to `.env`.
4. Add your MongoDB Atlas connection string to `MONGO_URI`.
5. Start the API with `uvicorn main:app --reload`.

The backend runs on `http://localhost:8000`.
