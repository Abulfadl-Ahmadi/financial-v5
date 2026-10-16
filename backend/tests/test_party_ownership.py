"""Regression tests for the party/card ownership transition."""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Party, PartyKind, UserRole
from apps.financial.models import Account, Receipt, BankDeposit, CardOwnershipLog
from apps.financial.ownership import (
    CardConflict, register_card, receipts_for_party, normalize_card,
    register_bank_deposit, transfer_card_ownership, verify_workshop_deposit
)

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

    def test_persian_and_arabic_digits_and_delimiters_are_normalized(self):
        self.assertEqual(normalize_card('۶۱۰۴-۳۳۱۱-۲۲۳۳-۴۴۵۵'), self.destination.card_number)
        self.assertEqual(normalize_card('٦١٠٤ ٣٣١١ ٢٢٣٣ ٤٤٥٥'), self.destination.card_number)
        with self.assertRaises(ValueError):
            normalize_card('6037ABC123456789')
        with self.assertRaises(ValueError):
            normalize_card('1234')

    def test_workshop_card_rejects_person_owner(self):
        with self.assertRaises(CardConflict):
            register_card(party=self.worker, number='6037990000000001', workshop=True)

    def test_bank_deposit_and_workshop_verification(self):
        """Test Issue #35: Model bank deposit independently of card and verify workshop ownership."""
        owner_user = User.objects.create_user(username="owner_dep_test", role=UserRole.OWNER)

        # 1. Register a deposit for workshop
        deposit = register_bank_deposit(
            deposit_number="123-456-7890",
            iban="IR123456789012345678901234",
            bank_name="بانک ملت",
            owner=self.workshop,
            title="سپرده اصلی کارگاه"
        )
        self.assertFalse(deposit.is_verified_workshop_account)

        # 2. Verify deposit by owner
        verified = verify_workshop_deposit(deposit_id=deposit.id, verified_by=owner_user)
        self.assertTrue(verified.is_verified_workshop_account)
        self.assertEqual(verified.verified_by, owner_user)
        self.assertIsNotNone(verified.verified_at)

        # 3. Associate cards with the deposit
        self.source.deposit = verified
        self.source.save(update_fields=['deposit'])

        card2 = register_card(party=self.workshop, number='6104330000000002')
        card2.deposit = verified
        card2.save(update_fields=['deposit'])

        self.assertEqual(verified.cards.count(), 2)

    def test_card_ownership_transfer_with_audit_trail(self):
        """Test Issue #28: Card ownership transfer creates CardOwnershipLog and updates references cleanly."""
        accountant = User.objects.create_user(username="acc_transfer", role=UserRole.ACCOUNTANT)
        new_party = Party.objects.create(kind=PartyKind.PERSON, display_name="خیاط جدید")

        card = register_card(party=self.worker, number='6037991122334499', primary=True)
        self.assertTrue(card.is_primary)
        self.assertEqual(card.owner, self.worker)

        # Transfer ownership
        transferred = transfer_card_ownership(
            card=card,
            new_party=new_party,
            changed_by=accountant,
            reason="انتقال کارت به پرسنل جدید"
        )

        self.assertEqual(transferred.owner, new_party)
        self.assertFalse(transferred.is_primary) # Reset primary flag on transfer

        # Check audit log
        log = CardOwnershipLog.objects.filter(card=transferred).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.from_party, self.worker)
        self.assertEqual(log.to_party, new_party)
        self.assertEqual(log.changed_by, accountant)
        self.assertIn("انتقال کارت", log.reason)
