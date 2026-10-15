from ninja import Router
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from typing import List
from django.contrib.auth import authenticate
from apps.users.models import User, Party, PartyKind, UserRole
from apps.users.schemas import UserOut, UserCreateIn, UserUpdateIn, LoginIn, PartyIn, PartyOut
from apps.financial.models import Account
from apps.financial.schemas import ReceiptOut, AccountOut, AccountIn
from apps.financial.ownership import CardConflict, get_user_party, register_card, register_user_cards, receipts_for_party
from django.db import transaction
from ninja_jwt.tokens import RefreshToken

router = Router(tags=["Users & Auth"])


def require_finance_manager(request):
    if request.user.role not in ('OWNER', 'ACCOUNTANT'):
        raise HttpError(403, 'Financial management permission required')


def require_owner(request):
    if request.user.role != 'OWNER':
        raise HttpError(403, 'Owner permission required')

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

@router.get('/parties', response=List[PartyOut], auth=JWTAuth())
def list_parties(request):
    require_finance_manager(request)
    return Party.objects.order_by('-id')


@router.post('/parties', response=PartyOut, auth=JWTAuth())
def create_party(request, payload: PartyIn):
    require_finance_manager(request)
    if payload.kind not in PartyKind.values or not payload.display_name.strip():
        raise HttpError(400, 'Invalid counterparty')
    return Party.objects.create(kind=payload.kind, display_name=payload.display_name.strip())


@router.get('/parties/{party_id}/accounts', response=List[AccountOut], auth=JWTAuth())
def get_party_accounts(request, party_id: int):
    require_finance_manager(request)
    if not Party.objects.filter(pk=party_id).exists():
        raise HttpError(404, 'Party not found')
    return Account.objects.filter(owner_id=party_id).select_related('owner').order_by('-is_primary', '-id')


@router.get('/parties/{party_id}/receipts', response=List[ReceiptOut], auth=JWTAuth())
def get_party_receipts(request, party_id: int):
    require_finance_manager(request)
    party = Party.objects.filter(pk=party_id).first()
    if not party:
        raise HttpError(404, 'Party not found')
    return receipts_for_party(party)


@router.get("/me", response=UserOut, auth=JWTAuth())
def get_current_user(request):
    if not request.user.is_authenticated:
        raise HttpError(401, "Not authenticated")
    return request.user

@router.get("/", response=List[UserOut], auth=JWTAuth())
def list_users(request):
    require_finance_manager(request)
    return User.objects.prefetch_related("bank_accounts").all().order_by("-id")

@router.get("/{user_id}", response=UserOut, auth=JWTAuth())
def get_user(request, user_id: int):
    require_finance_manager(request)
    try:
        return User.objects.prefetch_related("bank_accounts").get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

@router.get("/{user_id}/accounts", response=List[AccountOut], auth=JWTAuth())
def get_user_accounts(request, user_id: int):
    require_finance_manager(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    return Account.objects.filter(owner=get_user_party(user)).select_related('owner').order_by('-is_primary', '-id')

@router.post("/{user_id}/accounts", response=AccountOut, auth=JWTAuth())
def add_user_account(request, user_id: int, payload: AccountIn):
    require_finance_manager(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    try:
        return register_card(
            party=get_user_party(user), number=payload.card_number,
            first_name=payload.f_name or user.first_name or user.username,
            last_name=payload.l_name or user.last_name or '',
        )
    except (ValueError, CardConflict) as exc:
        raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc

@router.get("/{user_id}/receipts", response=List[ReceiptOut], auth=JWTAuth())
def get_user_receipts(request, user_id: int):
    require_finance_manager(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    return receipts_for_party(get_user_party(user))

@router.post("/", response=UserOut, auth=JWTAuth())
@transaction.atomic
def create_user(request, payload: UserCreateIn):
    require_owner(request)
    if User.objects.filter(username=payload.username).exists():
        raise HttpError(400, "Username already exists")
    if payload.role not in UserRole.values:
        raise HttpError(400, 'Invalid user role')
    selected_party = None
    if payload.party_id is not None:
        selected_party = Party.objects.filter(pk=payload.party_id).first()
        if not selected_party:
            raise HttpError(404, 'Party not found')
        if User.objects.filter(party=selected_party).exists():
            raise HttpError(409, 'This party already has a login user')

    user = User.objects.create_user(
        username=payload.username,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email or "",
        role=payload.role,
        phone_number=payload.phone_number,
        card_number=None,
        party=selected_party,
        brand_name=payload.brand_name,
        is_active=payload.is_active if payload.is_active is not None else True
    )

    try:
        register_user_cards(user, primary=payload.card_number, additional=payload.additional_cards)
    except (ValueError, CardConflict) as exc:
        transaction.set_rollback(True)
        raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc
    return user

@router.put("/{user_id}", response=UserOut, auth=JWTAuth())
@transaction.atomic
def update_user(request, user_id: int, payload: UserUpdateIn):
    require_owner(request)
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
        if payload.role not in UserRole.values:
            raise HttpError(400, 'Invalid user role')
        user.role = payload.role
    if 'party_id' in payload.model_fields_set and payload.party_id != user.party_id:
        raise HttpError(409, 'Reassigning a login to another party requires reviewed transfer')
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.phone_number is not None:
        user.phone_number = payload.phone_number
    if payload.brand_name is not None:
        user.brand_name = payload.brand_name
    if payload.password:
        user.set_password(payload.password)

    user.save()
    party = get_user_party(user)
    if party.kind == PartyKind.PERSON:
        party.display_name = f'{user.first_name} {user.last_name}'.strip() or user.username
        party.save(update_fields=['display_name'])
    if 'card_number' in payload.model_fields_set or 'additional_cards' in payload.model_fields_set:
        primary = payload.card_number if 'card_number' in payload.model_fields_set else user.card_number
        try:
            register_user_cards(user, primary=primary, additional=payload.additional_cards)
        except (ValueError, CardConflict) as exc:
            transaction.set_rollback(True)
            raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc
    return user

@router.delete("/{user_id}", auth=JWTAuth())
def delete_user(request, user_id: int):
    require_owner(request)
    try:
        user = User.objects.get(id=user_id)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return {'success': True, 'archived': True}
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

@router.patch("/{user_id}/toggle-active", response=UserOut, auth=JWTAuth())
def toggle_user_active(request, user_id: int):
    require_owner(request)
    try:
        user = User.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return user
    except User.DoesNotExist:
        raise HttpError(404, "User not found")
