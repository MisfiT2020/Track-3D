import random
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import pandas as pd
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from typing import List
import google.generativeai as genai
from app import schemas, models, auth, database  
from app.schemas import *
import config, json

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

genai.configure(api_key=config.GOOGLE_API_KEY)


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    userid = payload.get("userid")
    if not userid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: Missing user ID",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_user = db.query(models.User).filter(models.User.userid == userid).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return db_user

def require_sudo(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_sudo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admins only"
        )
    return current_user

@router.post("/signup", response_model=schemas.UserBase)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username unavailable")
    
    hashed_password = auth.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        hashed_password=hashed_password,
        userid=random.randint(100000, 999999) 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(
        data={"sub": db_user.username, "userid": db_user.userid, "is_sudo": db_user.is_sudo}
    )
    refresh_token = auth.create_refresh_token(
        data={"sub": db_user.username, "userid": db_user.userid, "is_sudo": db_user.is_sudo}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "userid": db_user.userid
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh_token(token: str):
    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Optionally, you might also check that the token is indeed a refresh token
    # (for example, by adding a "type": "refresh" field when creating it)

    new_access_token = auth.create_access_token(
        data={
            "sub": payload.get("sub"),
            "userid": payload.get("userid"),
            "is_sudo": payload.get("is_sudo")
        }
    )
    return {"access_token": new_access_token, "token_type": "bearer"}



@router.get("/recent-imports")
def get_recent_imports(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    recent_imports = (
        db.query(models.RecentImport)
        .filter(models.RecentImport.user_id == current_user.userid)
        .order_by(models.RecentImport.created_at.desc())
        .all()  # Fetch all records
    )

    if not recent_imports:
        return []

    return [
        {
            "chart_data": json.loads(import_entry.chart_data),
            "prediction": import_entry.prediction,  # Include the generated AI text
            "created_at": import_entry.created_at.isoformat(),
        }
        for import_entry in recent_imports
    ]


@router.get("/protected")
def protected_route(current_user: models.User = Depends(get_current_user)):
    return {
        "message": f"Welcome, {current_user.username}!",
        "userid": current_user.userid,
        "is_sudo": current_user.is_sudo
    }

@router.get("/admin")
def admin_only_route(current_user: models.User = Depends(require_sudo)):
    return {"message": f"Welcome, {current_user.username}! to admin access."}

@router.post("/change-password")
def change_password(
    request: schemas.ChangePassword,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not auth.verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Old password is incorrect."
        )
    
    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Password changed successfully."}


@router.get("/admin-panel-users", response_model=List[schemas.UserBase])
def get_all_users(current_user: models.User = Depends(require_sudo), db: Session = Depends(get_db)):
    return db.query(models.User).all()


@router.put("/admin-panel", response_model=schemas.UserBase)
def admin_panel_update(
    update: schemas.UserAdminUpdate,
    current_user: models.User = Depends(require_sudo),
    db: Session = Depends(get_db)
):
    target_user = db.query(models.User).filter(models.User.userid == update.userid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update.new_password:
        target_user.hashed_password = auth.get_password_hash(update.new_password)
    
    if update.is_admin is not None:
        target_user.is_sudo = update.is_admin

    db.commit()
    db.refresh(target_user)
    return target_user


@router.delete("/admin-panel/{userid}", response_model=schemas.UserBase)
def delete_user(userid: int, current_user: models.User = Depends(require_sudo), db: Session = Depends(get_db)):
    target_user = db.query(models.User).filter(models.User.userid == userid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(target_user)
    db.commit()
    return target_user

genai.configure(api_key=config.GOOGLE_API_KEY)

generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "top_k": 64,
    "max_output_tokens": 65536,
    "response_mime_type": "text/plain",
}

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-thinking-exp-01-21",
    generation_config=generation_config,
)


@router.post("/predict", response_model=dict)
async def predict_completion(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Read CSV
        df = pd.read_csv(file.file)
        print("CSV Columns:", df.columns.tolist())
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
        column_mapping = {"progress_percent": "actual_progress"}
        df.rename(columns=column_mapping, inplace=True)
        if "days_elapsed" not in df.columns or "days_remaining" not in df.columns:
            raise HTTPException(status_code=400, detail="Missing required columns: days_elapsed and/or days_remaining.")
        if "planned_progress" not in df.columns:
            df["planned_progress"] = (df["days_elapsed"] / (df["days_elapsed"] + df["days_remaining"])) * 100

        # Extract only required columns for chart data.
        required_columns = ["days_elapsed", "planned_progress", "actual_progress"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_columns)}. Check CSV format.")

        extracted_data = df[required_columns].to_dict(orient="records")
        progress_summary = df.to_string()

        prompt = [
            "You are an AI-powered construction assistant. Get the insights and forecast based on the data with current trends in only 7 lines.",
            f"Input data:\n{progress_summary}",
        ]
        if model is None:
            raise HTTPException(status_code=500, detail="AI model not initialized.")
        ai_response = model.generate_content(prompt)

        # Save recent import record.
        recent = models.RecentImport(
            user_id=current_user.userid,
            prediction=ai_response.text,  # Optional: store AI response.
            chart_data=json.dumps(extracted_data)
        )
        db.add(recent)
        db.commit()

        return {"prediction": ai_response.text, "chart_data": extracted_data}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/import-csv")
async def import_csv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(require_sudo),
    db: Session = Depends(get_db)
):
    """
    Endpoint to import construction CSV data.
    Expected CSV format:
      project_id,progress_percent,materials_used,workforce,days_elapsed,days_remaining
    """
    try:
        
        df = pd.read_csv(file.file)

        
        expected_columns = {"project_id", "progress_percent", "materials_used", "workforce", "days_elapsed", "days_remaining"}
        if not expected_columns.issubset(set(df.columns)):
            raise HTTPException(status_code=400, detail="CSV format is invalid. Expected columns: " + ", ".join(expected_columns))
        
        
        
        preview = df.head().to_dict(orient="records")
        return {
            "message": "CSV imported successfully",
            "rows": df.shape[0],
            "columns": list(df.columns),
            "preview": preview,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
