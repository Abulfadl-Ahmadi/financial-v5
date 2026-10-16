"""Single write seam for party/card relationships and payment ownership."""
import re

from django.db import IntegrityError, transaction
from django.db.models import Q
from apps.users.models import Party, PartyKind
from apps.financial.models import Account, Receipt, BankDeposit, CardOwnershipLog


class CardConflict(ValueError):
    """A card belongs to another party and cannot be silently transferred."""


def normalize_card(value):
    digits = str(value or '').translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'))
    digits = re.sub(r'[\s-]', '', digits)
    if not re.fullmatch(r'[0-9]{16}', digits):
        raise ValueError('Card number must contain exactly 16 digits')
    return digits


@transaction.atomic
def get_user_party(user):
    if user.party_id:
        return user.party
    locked = type(user).objects.select_for_update().get(pk=user.pk)
    if locked.party_id:
        user.party = locked.party
        return locked.party
    name = f'{user.first_name} {user.last_name}'.strip() or user.username
    party = Party.objects.create(display_name=name, kind=PartyKind.ORGANIZATION if user.brand_name else PartyKind.PERSON)
    locked.party = party
    locked.save(update_fields=['party'])
    user.party = party
    return party


@transaction.atomic
def register_card(*, party, number, first_name='', last_name='', primary=False, workshop=False):
    if not party.is_active:
        raise CardConflict('Archived counterparties cannot receive new cards')
    number = normalize_card(number)
    existing = Account.objects.select_for_update().filter(card_number=number).first()
    if existing:
        if existing.owner_id != party.pk:
            raise CardConflict('This card is already registered for another party')
        if not existing.is_active:
            raise CardConflict('Archived cards cannot be reactivated implicitly')
        if workshop and party.kind != PartyKind.WORKSHOP:
            raise CardConflict('Only workshop-owned cards can be workshop paying accounts')
        account = existing
    else:
        if workshop and party.kind != PartyKind.WORKSHOP:
            raise CardConflict('Only workshop-owned cards can be workshop paying accounts')
        try:
            with transaction.atomic():
                account = Account.objects.create(
                    card_number=number, owner=party,
                    f_name=first_name or party.display_name,
                    l_name=last_name or '',
                    is_workshop_account=workshop,
                    user=party.login_user if hasattr(party, 'login_user') else None,
                )
        except IntegrityError as exc:
            raise CardConflict('This card was registered concurrently; retry after reviewing its owner') from exc
    if hasattr(party, 'login_user') and account.user_id != party.login_user.pk:
        account.user = party.login_user
        account.save(update_fields=['user'])
    if workshop and not account.is_workshop_account:
        account.is_workshop_account = True
        account.save(update_fields=['is_workshop_account'])
    if primary:
        # Serialize changes for a party and rely on the unique partial index too.
        Party.objects.select_for_update().get(pk=party.pk)
        Account.objects.filter(owner=party, is_primary=True).exclude(pk=account.pk).update(is_primary=False)
        if not account.is_primary:
            account.is_primary = True
            account.save(update_fields=['is_primary'])
        if hasattr(party, 'login_user') and party.login_user.card_number != account.card_number:
            login_user = party.login_user
            login_user.card_number = account.card_number
            login_user.save(update_fields=['card_number'])
    return account


@transaction.atomic
def register_user_cards(user, primary=None, additional=None):
    """Add cards to a user party; omitted cards are not deleted implicitly."""
    party = get_user_party(user)
    primary_number = normalize_card(primary) if primary else None
    extras = [normalize_card(raw) for raw in (additional or [])]
    numbers = ([primary_number] if primary_number else []) + extras
    if len(set(numbers)) != len(numbers):
        raise ValueError('Duplicate card numbers are not allowed')
    for number in numbers:
        existing = Account.objects.select_for_update().filter(card_number=number).first()
        if existing and existing.owner_id != party.pk:
            raise CardConflict('This card is already registered for another party')
        if existing and not existing.is_active:
            raise CardConflict('An archived card cannot be reactivated implicitly')
    if primary_number:
        register_card(party=party, number=primary_number, first_name=user.first_name or user.username,
                      last_name=user.last_name, primary=True)
    for number in extras:
        register_card(party=party, number=number, first_name=user.first_name or user.username,
                      last_name=user.last_name)
    # The legacy field remains a compatibility mirror until all old clients migrate.
    if primary_number is None and user.card_number:
        Party.objects.select_for_update().get(pk=party.pk)
        Account.objects.filter(owner=party, is_primary=True).update(is_primary=False)
    if user.card_number != primary_number:
        user.card_number = primary_number
        user.save(update_fields=['card_number'])
    return party


@transaction.atomic
def create_external_card(*, number, first_name='', last_name='', user=None, party=None):
    """Create a card for a party with or without a login; never claim a known PAN."""
    number = normalize_card(number)
    if party and user and get_user_party(user).pk != party.pk:
        raise CardConflict('Selected party and login account disagree')
    if party and not party.is_active:
        raise CardConflict('Archived counterparties cannot receive new cards')
    existing = Account.objects.select_for_update().filter(card_number=number).first()
    if existing:
        if (not party and not user) or existing.owner_id != (party.pk if party else get_user_party(user).pk):
            raise CardConflict('Choose the existing registered card; receiving a payment never claims ownership')
        if not existing.is_active:
            raise CardConflict('Archived cards cannot be used for payments')
        return existing
    if party is None:
        party = get_user_party(user) if user else Party.objects.create(
            display_name=f'{first_name} {last_name}'.strip() or 'طرف حساب بیرونی', kind=PartyKind.EXTERNAL,
        )
    return register_card(party=party, number=number, first_name=first_name, last_name=last_name)


def snapshot_receipt_owners(receipt):
    receipt.from_party_id = receipt.from_account.owner_id
    receipt.to_party_id = receipt.to_account.owner_id
    if not receipt.from_party_id or not receipt.to_party_id:
        raise ValueError('Every payment card must belong to a party')
    return receipt


def receipts_for_party(party):
    return Receipt.objects.filter(Q(from_party=party) | Q(to_party=party)).select_related(
        'from_account', 'to_account', 'from_account__owner', 'to_account__owner'
    ).distinct().order_by('-created_at')


@transaction.atomic
def register_bank_deposit(*, deposit_number, bank_name, owner, iban=None, title=None, is_workshop=False, verified_by=None):
    """Register or get a legal bank deposit account for a party."""
    if not owner.is_active:
        raise ValueError('طرف حساب غیرفعال نمی‌تواند حساب بانکی داشته باشد')
    if is_workshop and owner.kind != PartyKind.WORKSHOP:
        raise CardConflict('تنها حساب‌های متعلق به طرف‌حساب کارگاه می‌توانند حساب کارگاهی باشند')

    dep_num = str(deposit_number or '').translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')).strip()
    if not dep_num:
        raise ValueError('شماره حساب / سپرده الزامی است')

    clean_iban = str(iban or '').strip() if iban else None
    deposit, created = BankDeposit.objects.get_or_create(
        deposit_number=dep_num,
        defaults={
            'bank_name': bank_name,
            'owner': owner,
            'iban': clean_iban,
            'title': title,
            'is_verified_workshop_account': is_workshop,
            'verified_by': verified_by,
        }
    )
    if not created:
        if deposit.owner_id != owner.pk:
            raise CardConflict('این شماره سپرده قبلاً برای طرف حساب دیگری ثبت شده است')
        if is_workshop and not deposit.is_verified_workshop_account:
            deposit.is_verified_workshop_account = True
            deposit.verified_by = verified_by
            deposit.save(update_fields=['is_verified_workshop_account', 'verified_by'])
    return deposit


@transaction.atomic
def transfer_card_ownership(*, card, new_party, changed_by=None, reason=''):
    """Audited transfer of card ownership from one party to another."""
    if not new_party.is_active:
        raise CardConflict('امکان انتقال کارت به طرف حساب غیرفعال وجود ندارد')
    if card.owner_id == new_party.pk:
        return card

    old_party = card.owner
    if card.is_workshop_account and new_party.kind != PartyKind.WORKSHOP:
        card.is_workshop_account = False

    if card.is_primary:
        card.is_primary = False

    card.owner = new_party
    card.user = new_party.login_user if hasattr(new_party, 'login_user') else None
    card.save()

    CardOwnershipLog.objects.create(
        card=card,
        from_party=old_party,
        to_party=new_party,
        changed_by=changed_by,
        reason=reason or 'Reviewed transfer of card ownership'
    )
    return card


@transaction.atomic
def verify_workshop_deposit(*, deposit_id, verified_by):
    """Explicit verification of legal workshop ownership for a bank deposit."""
    if getattr(verified_by, 'role', None) not in ('OWNER', 'ACCOUNTANT'):
        raise PermissionError('تنها مدیر یا حسابدار می‌تواند حساب کارگاه را تایید کند')

    deposit = BankDeposit.objects.select_for_update().get(id=deposit_id)
    if deposit.owner.kind != PartyKind.WORKSHOP:
        raise CardConflict('مالک حقوقی سپرده باید از نوع کارگاه باشد')

    deposit.is_verified_workshop_account = True
    deposit.verified_by = verified_by
    from django.utils import timezone
    deposit.verified_at = timezone.now()
    deposit.save(update_fields=['is_verified_workshop_account', 'verified_by', 'verified_at'])
    return deposit
