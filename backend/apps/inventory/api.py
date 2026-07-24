from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.inventory.models import FabricType, ClothRoll
from apps.inventory.schemas import FabricTypeOut, FabricTypeIn, ClothRollOut, ClothRollIn

router = Router(tags=["Inventory (انبار پارچه)"])

@router.get("/fabric-types", response=List[FabricTypeOut])
def list_fabric_types(request):
    return FabricType.objects.all()

@router.post("/fabric-types", response=FabricTypeOut)
def create_fabric_type(request, payload: FabricTypeIn):
    fabric, _ = FabricType.objects.get_or_create(name=payload.name)
    return fabric

@router.get("/rolls", response=List[ClothRollOut])
def list_rolls(request):
    return ClothRoll.objects.select_related("fabric_type").all().order_by("-id")

@router.post("/rolls", response=ClothRollOut)
def create_roll(request, payload: ClothRollIn):
    if ClothRoll.objects.filter(roll_code=payload.roll_code).exists():
        raise HttpError(400, "کد طاقه تکراری است")
    
    try:
        fabric = FabricType.objects.get(id=payload.fabric_type_id)
    except FabricType.DoesNotExist:
        raise HttpError(404, "نوع پارچه یافت نشد")
        
    roll = ClothRoll.objects.create(
        roll_code=payload.roll_code,
        fabric_type=fabric,
        color=payload.color,
        shade=payload.shade,
        length_meters=payload.length_meters,
        supplier_name=payload.supplier_name
    )
    return roll
