from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.cutting.models import Cut, CutRollUsage
from apps.cutting.schemas import CutOut, CutCreateIn
from apps.users.models import User
from apps.inventory.models import ClothRoll

router = Router(tags=["Cutting Workshop (کارگاه برش)"])

@router.get("/cuts", response=List[CutOut])
def list_cuts(request):
    return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").all().order_by("-created_at")

@router.get("/cuts/{cut_code}", response=CutOut)
def get_cut_detail(request, cut_code: str):
    try:
        return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").get(cut_code=cut_code)
    except Cut.DoesNotExist:
        raise HttpError(404, "دستور برش یافت نشد")

@router.post("/cuts", response=CutOut)
def create_cut(request, payload: CutCreateIn):
    if Cut.objects.filter(cut_code=payload.cut_code).exists():
        raise HttpError(400, "کد دستور برش تکراری است")
    
    try:
        owner = User.objects.get(id=payload.owner_id)
    except User.DoesNotExist:
        raise HttpError(404, "کاربر سفارش‌دهنده یافت نشد")
        
    cutter = User.objects.filter(id=payload.cutter_id).first() if payload.cutter_id else None
    
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
    
    for item in payload.roll_usages:
        roll = ClothRoll.objects.get(id=item.roll_id)
        CutRollUsage.objects.create(
            cut=cut,
            roll=roll,
            used_meters=item.used_meters,
            used_layers=item.used_layers,
            produced_pieces=item.produced_pieces
        )
        
    return Cut.objects.select_related("owner", "cutter").prefetch_related("roll_usages__roll__fabric_type").get(cut_code=cut.cut_code)
