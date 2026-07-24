from ninja import Router
from ninja.errors import HttpError
from typing import List
from django.contrib.auth import authenticate
from apps.users.models import User
from apps.users.schemas import UserOut, UserCreateIn, UserUpdateIn, LoginIn
from ninja_jwt.tokens import RefreshToken

router = Router(tags=["Users & Auth"])

@router.post("/login")
def login(request, payload: LoginIn):
    user = authenticate(username=payload.username, password=payload.password)
    if not user:
        raise HttpError(401, "Invalid username or password")
    
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserOut.from_orm(user)
    }

@router.get("/me", response=UserOut)
def get_current_user(request):
    if not request.user.is_authenticated:
        raise HttpError(401, "Not authenticated")
    return request.user

@router.get("/", response=List[UserOut])
def list_users(request):
    return User.objects.all().order_by("-id")

@router.get("/{user_id}", response=UserOut)
def get_user(request, user_id: int):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

@router.post("/", response=UserOut)
def create_user(request, payload: UserCreateIn):
    if User.objects.filter(username=payload.username).exists():
        raise HttpError(400, "Username already exists")
    
    user = User.objects.create_user(
        username=payload.username,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email or "",
        role=payload.role,
        phone_number=payload.phone_number,
        card_number=payload.card_number,
        brand_name=payload.brand_name
    )
    return user

@router.put("/{user_id}", response=UserOut)
def update_user(request, user_id: int, payload: UserUpdateIn):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
    
    if payload.username and payload.username != user.username:
        if User.objects.filter(username=payload.username).exists():
            raise HttpError(400, "Username already exists")
        user.username = payload.username
    
    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.email is not None:
        user.email = payload.email
    if payload.role is not None:
        user.role = payload.role
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.card_number is not None:
        user.card_number = payload.card_number
    if payload.brand_name is not None:
        user.brand_name = payload.brand_name
    if payload.password:
        user.set_password(payload.password)
        
    user.save()
    return user

@router.delete("/{user_id}")
def delete_user(request, user_id: int):
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return {"success": True}
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
