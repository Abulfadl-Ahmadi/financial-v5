from ninja import Router
from ninja.errors import HttpError
from django.contrib.auth import authenticate
from apps.users.schemas import LoginIn, UserOut
from ninja_jwt.tokens import RefreshToken

router = Router(tags=["Portal Auth"])

@router.post("/client/login", auth=None)
def client_login(request, payload: LoginIn):
    user = authenticate(username=payload.username, password=payload.password)
    if not user:
        raise HttpError(401, "Invalid credentials")
    if not user.brand_name:
        raise HttpError(403, "Not a contractor account")

    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserOut.from_orm(user)
    }

@router.post("/worker/login", auth=None)
def worker_login(request, payload: LoginIn):
    user = authenticate(username=payload.username, password=payload.password)
    if not user:
        raise HttpError(401, "Invalid credentials")
    if user.role != "WORKER":
        raise HttpError(403, "Not a worker account")
        
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserOut.from_orm(user)
    }
