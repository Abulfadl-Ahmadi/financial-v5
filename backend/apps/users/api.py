from ninja import Router, Schema
from ninja_jwt.authentication import JWTAuth
from ninja.errors import HttpError
from typing import List
from django.contrib.auth import authenticate
from apps.users.models import User, Party, PartyKind, UserRole
from apps.users.schemas import UserOut, UserCreateIn, UserUpdateIn, LoginIn, PartyIn, PartyOut
from apps.financial.models import Account
from apps.financial.schemas import ReceiptOut, AccountOut, AccountIn
from apps.financial.ownership import CardConflict, get_user_party, normalize_card, register_card, register_user_cards, receipts_for_party
from django.db import transaction
from ninja_jwt.tokens import RefreshToken

router = Router(tags=["Users & Auth"])


from apps.users.permissions import require_owner, require_finance_manager

@router.post("/login", auth=None)
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
    if payload.kind == PartyKind.WORKSHOP:
        require_owner(request)
    return Party.objects.create(kind=payload.kind, display_name=payload.display_name.strip())


@router.get('/parties/{party_id}/accounts', response=List[AccountOut], auth=JWTAuth())
def get_party_accounts(request, party_id: int):
    require_finance_manager(request)
    if not Party.objects.filter(pk=party_id).exists():
        raise HttpError(404, 'Party not found')
    return Account.objects.filter(owner_id=party_id, is_active=True).select_related('owner').order_by('-is_primary', '-id')


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

class BulkUsersActionIn(Schema):
    ids: List[int]

@router.post("/bulk-delete", auth=JWTAuth())
def bulk_delete_users(request, payload: BulkUsersActionIn):
    require_owner(request)
    count = User.objects.filter(id__in=payload.ids).update(is_active=False)
    return {"success": True, "count": count}

@router.post("/bulk-toggle-active", auth=JWTAuth())
def bulk_toggle_active_users(request, payload: BulkUsersActionIn):
    require_owner(request)
    users = list(User.objects.filter(id__in=payload.ids))
    for u in users:
        u.is_active = not u.is_active
        u.save(update_fields=['is_active'])
    return {"success": True, "count": len(users)}

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

    return Account.objects.filter(owner=get_user_party(user), is_active=True).select_related('owner').order_by('-is_primary', '-id')

@router.post("/{user_id}/accounts", response=AccountOut, auth=JWTAuth())
@transaction.atomic
def add_user_account(request, user_id: int, payload: AccountIn):
    require_finance_manager(request)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise HttpError(404, "User not found")

    try:
        if payload.party_id and payload.party_id != get_user_party(user).pk:
            raise CardConflict('A user can register cards only for their own party')
        return register_card(
            party=get_user_party(user), number=payload.card_number,
            first_name=payload.f_name or user.first_name or user.username,
            last_name=payload.l_name or user.last_name or '', primary=payload.is_primary,
        )
    except (ValueError, CardConflict) as exc:
        transaction.set_rollback(True)
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
        if not selected_party.is_active:
            raise HttpError(409, 'Archived parties cannot receive a login')
        if selected_party.kind == PartyKind.WORKSHOP:
            raise HttpError(409, 'Workshop legal entity does not use a personal login')
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
        primary_card = Account.objects.filter(owner=party, is_primary=True, is_active=True).first()
        primary = primary_card.card_number if primary_card else None
        if 'card_number' in payload.model_fields_set and payload.card_number:
            try:
                requested_card = normalize_card(payload.card_number)
            except ValueError as exc:
                raise HttpError(400, str(exc)) from exc
            if not primary or requested_card != primary:
                raise HttpError(409, 'Change the primary card through the card management endpoint')
        if 'card_number' in payload.model_fields_set and payload.card_number is None and primary:
            raise HttpError(409, 'Change the primary card through the card management endpoint')
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
