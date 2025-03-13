import random
import os, io
import config, json
import pandas as pd
from PIL import Image
from typing import List
import google.generativeai as genai

from app import schemas
from app.schemas import *
from app.routes.utils.utils import * 
from fastapi import Request
from fastapi import APIRouter, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

router = APIRouter()

genai.configure(api_key=config.GEMINI_API_KEY)

@router.put("/change-username", response_model=schemas.UserBase)
def change_username(
    update: schemas.ChangeUsername,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    existing_user = db.query(models.User).filter(
    models.User.username == update.new_username,
    models.User.userid != current_user.userid
    ).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username unavailable")
    
    current_user.username = update.new_username
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/sign-up", response_model=schemas.UserBase)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username unavailable")
    
    hashed_password = auth.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        email=user.email,  
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
        .all()  
    )

    if not recent_imports:
        return []
    
    response_data = [
        {
            "chart_data": json.loads(import_entry.chart_data),
            "prediction": import_entry.prediction,  
            "created_at": import_entry.created_at.isoformat(),
        }
        for import_entry in recent_imports
    ]
    
    sanitized_response = sanitize_nans(response_data)
    return JSONResponse(content=sanitized_response)


@router.get("/protected")
def protected_route(current_user: models.User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "joined_date": current_user.joined_date.isoformat(),
        "userid": current_user.userid,
        "profile_pic": current_user.profile_pic,
        "is_sudo": current_user.is_sudo,
        "role": "Admin" if current_user.is_sudo else "Member"
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

@router.post("/predict", response_model=dict)
async def predict_completion(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        
        df = pd.read_csv(file.file)
        print("CSV Columns:", df.columns.tolist())
        df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
        column_mapping = {"progress_percent": "actual_progress"}
        df.rename(columns=column_mapping, inplace=True)
        if "days_elapsed" not in df.columns or "days_remaining" not in df.columns:
            raise HTTPException(status_code=400, detail="Missing required columns: days_elapsed and/or days_remaining.")
        if "planned_progress" not in df.columns:
            df["planned_progress"] = (df["days_elapsed"] / (df["days_elapsed"] + df["days_remaining"])) * 100

        required_columns = ["days_elapsed", "planned_progress", "actual_progress"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing_columns)}. Check CSV format.")

        extracted_data = df[required_columns].to_dict(orient="records")
        progress_summary = df.to_string()

        prompt = [
            "You are an AI-powered construction assistant.", 
            f"Get the insights and forecast based on the data with current trends in real-time", 
            f"make it 10 lines with points wise in new line for each point.",
            f"Input data:\n{progress_summary}",
        ]
        if model is None:
            raise HTTPException(status_code=500, detail="AI model not initialized.")
        ai_response = model.generate_content(prompt)

    
        recent = models.RecentImport(
            user_id=current_user.userid,
            prediction=ai_response.text,  
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

@router.post("/upload-profile-pic")
async def upload_profile_pic(
    profile_pic: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not profile_pic.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only image files are allowed.")
    
    file_extension = os.path.splitext(profile_pic.filename)[1]
    file_name = f"profile_pic_{current_user.userid}.jpg"
    
    upload_folder = os.path.join("static", "profile_pics")
    os.makedirs(upload_folder, exist_ok=True)
    file_path = os.path.join(upload_folder, file_name)

    if os.path.exists(file_path):
        os.remove(file_path)
    
    content = await profile_pic.read()

    try:
        image = Image.open(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to open image.")

    if image.mode != "RGB":
        image = image.convert("RGB")
    
    image.thumbnail((200, 200))
    
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=70)
    buffer.seek(0)
    
    with open(file_path, "wb") as f:
        f.write(buffer.getvalue())
    
    backend_url = config.PORT
    profile_pic_url = f"{backend_url}/static/profile_pics/{file_name}"
    
    current_user.profile_pic = profile_pic_url
    db.commit()
    db.refresh(current_user)

    return {"profile_pic": profile_pic_url}

@router.get("/logs", response_model=List[str])
def get_logs(
    current_user: models.User = Depends(get_current_user)
):
    log_path = "log.txt"
    
    if not os.path.exists(log_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log file not found"
        )
    
    try:
        with open(log_path, "r") as log_file:
            logs = log_file.readlines()[::-1]
            
            cleaned_logs = [line.strip() for line in logs if line.strip()]
            
        return cleaned_logs
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading log file: {str(e)}"
        )
