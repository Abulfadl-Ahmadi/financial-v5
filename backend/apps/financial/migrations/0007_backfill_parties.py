"""Conservative data migration: never infer an owner from a matching name."""
from django.db import migrations


def forwards(apps, schema_editor):
    User = apps.get_model('users', 'User')
    Party = apps.get_model('users', 'Party')
    Account = apps.get_model('financial', 'Account')
    Receipt = apps.get_model('financial', 'Receipt')
    db = schema_editor.connection.alias

    for user in User.objects.using(db).filter(party_id__isnull=True).order_by('pk').iterator():
        name = f'{user.first_name} {user.last_name}'.strip() or user.username
        kind = 'ORGANIZATION' if user.brand_name else 'PERSON'
        party = Party.objects.using(db).create(display_name=name, kind=kind)
        User.objects.using(db).filter(pk=user.pk).update(party_id=party.pk)

    # A legacy workshop flag is not proof of legal ownership: preserve explicit
    # user links and leave ambiguous workshop-owned cards for manual review.
    for account in Account.objects.using(db).filter(owner_id__isnull=True).order_by('pk').iterator():
        if account.user_id:
            party_id = User.objects.using(db).values_list('party_id', flat=True).get(pk=account.user_id)
        else:
            name = f'{account.f_name} {account.l_name}'.strip() or 'طرف حساب بیرونی'
            party = Party.objects.using(db).create(display_name=name, kind='EXTERNAL')
            party_id = party.pk
        Account.objects.using(db).filter(pk=account.pk).update(owner_id=party_id)

    for user in User.objects.using(db).exclude(card_number__isnull=True).exclude(card_number='').iterator():
        account = Account.objects.using(db).filter(owner_id=user.party_id, card_number=user.card_number).first()
        if account and not Account.objects.using(db).filter(owner_id=user.party_id, is_primary=True).exists():
            Account.objects.using(db).filter(pk=account.pk).update(is_primary=True)

    # Never grant paying authority based on a legacy role/checkbox alone.
    # The legacy workshop flag is carried forward for administrative review;
    # runtime access is denied unless the owner is explicitly a WORKSHOP Party.

    for receipt in Receipt.objects.using(db).select_related('from_account', 'to_account').iterator():
        updates = {}
        if receipt.from_party_id is None:
            updates['from_party_id'] = receipt.from_account.owner_id
        if receipt.to_party_id is None:
            updates['to_party_id'] = receipt.to_account.owner_id
        if updates:
            Receipt.objects.using(db).filter(pk=receipt.pk).update(**updates)


def backwards(apps, schema_editor):
    # This reverse operation must be used only before writes to new Party data.
    # A production rollback after dual-write requires restoring the verified backup.
    User = apps.get_model('users', 'User')
    Party = apps.get_model('users', 'Party')
    Account = apps.get_model('financial', 'Account')
    Receipt = apps.get_model('financial', 'Receipt')
    db = schema_editor.connection.alias
    user_party_ids = set(User.objects.using(db).exclude(party_id__isnull=True).values_list('party_id', flat=True))
    owner_ids = set(Account.objects.using(db).exclude(owner_id__isnull=True).values_list('owner_id', flat=True))
    Receipt.objects.using(db).update(from_party_id=None, to_party_id=None)
    Account.objects.using(db).update(owner_id=None, is_primary=False)
    User.objects.using(db).update(party_id=None)
    Party.objects.using(db).filter(pk__in=user_party_ids | owner_ids).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('financial', '0006_account_is_active_account_is_primary_account_owner_and_more'),
        ('users', '0003_party_user_party'),
    ]

    operations = [migrations.RunPython(forwards, backwards)]
