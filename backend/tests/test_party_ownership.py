"""Regression tests for the party/card ownership transition."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Party, PartyKind
from apps.financial.models import Account, Receipt
from apps.financial.ownership import CardConflict, register_card, receipts_for_party, normalize_card

User = get_user_model()


class PartyOwnershipTests(TestCase):
    def setUp(self):
        self.workshop = Party.objects.create(kind=PartyKind.WORKSHOP, display_name='کارگاه')
        self.worker = Party.objects.create(kind=PartyKind.PERSON, display_name='کارگر')
        self.source = register_card(party=self.workshop, number='6037997112345678', first_name='کارگاه', workshop=True, primary=True)
        self.destination = register_card(party=self.worker, number='6104331122334455', first_name='کارگر', primary=True)

    def test_party_can_exist_without_login(self):
        self.assertFalse(User.objects.filter(party=self.worker).exists())
        self.assertEqual(self.destination.owner, self.worker)

    def test_other_party_cannot_claim_existing_card(self):
        with self.assertRaises(CardConflict):
            register_card(party=self.worker, number=self.source.card_number)
        self.source.refresh_from_db()
        self.assertEqual(self.source.owner, self.workshop)

    def test_primary_is_unique_per_party(self):
        second = register_card(party=self.worker, number='6037997112345679', primary=True)
        self.destination.refresh_from_db()
        self.assertFalse(self.destination.is_primary)
        self.assertTrue(second.is_primary)

    def test_receipt_report_is_based_on_snapshot_not_name(self):
        same_name = Party.objects.create(kind=PartyKind.PERSON, display_name='کارگر')
        receipt = Receipt.objects.create(
            tracking_code='t1', date_jalali='1405/01/01', from_account=self.source,
            to_account=self.destination, amount=1000, from_party=self.workshop, to_party=self.worker,
        )
        self.assertEqual(list(receipts_for_party(same_name)), [])
        self.assertEqual(list(receipts_for_party(self.worker)), [receipt])

    def test_receipt_is_in_both_directions_for_same_party_without_duplication(self):
        second_card = register_card(party=self.worker, number='6037997112345679')
        receipt = Receipt.objects.create(
            tracking_code='own-transfer', date_jalali='1405/01/02',
            from_account=self.destination, to_account=second_card, amount=50,
            from_party=self.worker, to_party=self.worker,
        )
        self.assertEqual(list(receipts_for_party(self.worker)), [receipt])

    def test_persian_digits_are_normalized(self):
        self.assertEqual(normalize_card('۶۱۰۴-۳۳۱۱-۲۲۳۳-۴۴۵۵'), self.destination.card_number)

    def test_workshop_card_rejects_person_owner(self):
        with self.assertRaises(CardConflict):
            register_card(party=self.worker, number='6037990000000001', workshop=True)
