from decimal import Decimal
from django.db import transaction
from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.cutting.models import Cut, CutRollUsage
from apps.cutting.schemas import CutOut, CutCreateIn
from apps.users.models import User
from apps.inventory.models import ClothRoll, RollStatus
from apps.users.permissions import require_cutting_supervisor

router = Router(tags=["Cutting Workshop (کارگاه برش)"])

@router.get("/cuts", response=List[CutOut])
def list_cuts(request):
    require_cutting_supervisor(request)
    return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").all().order_by("-created_at")

@router.get("/cuts/{cut_code}", response=CutOut)
def get_cut_detail(request, cut_code: str):
    require_cutting_supervisor(request)
    try:
        return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").get(cut_code=cut_code)
    except Cut.DoesNotExist:
        raise HttpError(404, "دستور برش یافت نشد")

@router.post("/cuts", response=CutOut)
@transaction.atomic
def create_cut(request, payload: CutCreateIn):
    require_cutting_supervisor(request)
    if Cut.objects.filter(cut_code=payload.cut_code).exists():
        raise HttpError(400, "کد دستور برش تکراری است")

    try:
        owner = User.objects.get(id=payload.owner_id)
    except User.DoesNotExist:
        raise HttpError(404, "کاربر سفارش‌دهنده یافت نشد")

    cutter = User.objects.filter(id=payload.cutter_id).first() if payload.cutter_id else None

    # Step 1: Pre-validate all rolls before creating anything
    roll_requirements: dict[int, Decimal] = {}
    for item in payload.roll_usages:
        used_m = Decimal(str(item.used_meters))
        if used_m <= Decimal('0'):
            raise HttpError(400, f"متراژ مصرفی برای طاقه با شناسه {item.roll_id} نامعتبر است")
        roll_requirements[item.roll_id] = roll_requirements.get(item.roll_id, Decimal('0')) + used_m

    # Lock and validate each roll with select_for_update()
    locked_rolls: dict[int, ClothRoll] = {}
    for roll_id, total_needed in roll_requirements.items():
        try:
            roll = ClothRoll.objects.select_for_update().get(id=roll_id)
        except ClothRoll.DoesNotExist:
            raise HttpError(404, f"طاقه پارچه با شناسه {roll_id} یافت نشد")

        if roll.status == RollStatus.EXHAUSTED:
            raise HttpError(400, f"طاقه {roll.roll_code} قبلاً تمام شده است")
        if total_needed > roll.length_meters:
            raise HttpError(
                400,
                f"موجودی طاقه {roll.roll_code} ({roll.length_meters} متر) کمتر از متراژ درخواستی ({total_needed} متر) است"
            )
        locked_rolls[roll_id] = roll

    # Step 2: Create Cut
    cut = Cut.objects.create(
        cut_code=payload.cut_code,
        model_name=payload.model_name,
        model_code=payload.model_code,
        size=payload.size,
        owner=owner,
        cutter=cutter,
        lai_per_unit=payload.lai_per_unit,
        product_per_layer=payload.product_per_layer,
        length_of_layers=payload.length_of_layers,
        cutting_price=payload.cutting_price,
        sewing_price=payload.sewing_price,
        cutting_price_raw=payload.cutting_price_raw,
        sewing_price_raw=payload.sewing_price_raw
    )

    # Step 3: Record CutRollUsage and deduct inventory from locked rolls
    for item in payload.roll_usages:
        roll = locked_rolls[item.roll_id]
        used_m = Decimal(str(item.used_meters))
        CutRollUsage.objects.create(
            cut=cut,
            roll=roll,
            used_meters=used_m,
            used_layers=item.used_layers,
            produced_pieces=item.produced_pieces
        )

    for roll_id, total_needed in roll_requirements.items():
        roll = locked_rolls[roll_id]
        roll.consume(total_needed)

    return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").get(cut_code=cut.cut_code)
