"""Party/account API regression scenarios using isolated test database."""
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Party, PartyKind, UserRole
from apps.financial.models import Account, Receipt
from ninja_jwt.tokens import RefreshToken

User = get_user_model()


class PartyApiTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='owner-test', password='pw', role=UserRole.OWNER)
        self.worker = User.objects.create_user(username='worker-test', password='pw', role=UserRole.WORKER)
        token = str(RefreshToken.for_user(self.owner).access_token)
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        self.workshop = Party.objects.create(kind=PartyKind.WORKSHOP, display_name='کارگاه')
        self.recipient = Party.objects.create(kind=PartyKind.PERSON, display_name='مریم')

    def post_json(self, path, body, **extra):
        return self.client.post(path, data=json.dumps(body), content_type='application/json', **extra)

    def test_party_can_be_created_without_login(self):
        response = self.post_json('/api/users/parties', {'display_name': 'تأمین‌کننده', 'kind': 'ORGANIZATION'}, **self.auth)
        self.assertEqual(response.status_code, 200)
        party_id = response.json()['id']
        self.assertFalse(User.objects.filter(party_id=party_id).exists())

    def test_anonymous_and_worker_cannot_create_party(self):
        payload = {'display_name': 'غیرمجاز', 'kind': 'EXTERNAL'}
        self.assertIn(self.post_json('/api/users/parties', payload).status_code, (401, 403))
        worker_token = str(RefreshToken.for_user(self.worker).access_token)
        self.assertEqual(self.post_json('/api/users/parties', payload, HTTP_AUTHORIZATION=f'Bearer {worker_token}').status_code, 403)

    def test_receipt_creation_keeps_party_snapshot(self):
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        dest = Account.objects.create(card_number='6104331122334455', owner=self.recipient, f_name='مریم', l_name='ب')
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-1', 'date_jalali': '1405/01/01', 'amount': 500,
            'from_account_id': source.pk, 'to_account_id': dest.pk,
        })
        self.assertEqual(response.status_code, 200)
        receipt = Receipt.objects.get(pk=response.json()['id'])
        self.assertEqual(receipt.from_party, self.workshop)
        self.assertEqual(receipt.to_party, self.recipient)

    def test_existing_card_cannot_be_silently_claimed(self):
        account = Account.objects.create(card_number='6037997112345678', owner=self.recipient, f_name='مریم', l_name='ب')
        other = Party.objects.create(display_name='دیگری')
        response = self.post_json('/api/financial/accounts', {
            'card_number': account.card_number, 'f_name': 'دیگری', 'l_name': 'شخص', 'party_id': other.pk,
        })
        self.assertEqual(response.status_code, 409)
        account.refresh_from_db()
        self.assertEqual(account.owner, self.recipient)

    def test_duplicate_card_conflict_rolls_back_user(self):
        account = Account.objects.create(card_number='6037997112345678', owner=self.recipient, f_name='مریم', l_name='ب')
        response = self.post_json('/api/users/', {
            'username': 'conflicting-login', 'password': 'pw12345678', 'first_name': 'دیگر',
            'last_name': 'شخص', 'role': 'WORKER', 'card_number': account.card_number,
        }, **self.auth)
        self.assertEqual(response.status_code, 409)
        self.assertFalse(User.objects.filter(username='conflicting-login').exists())
        account.refresh_from_db()
        self.assertEqual(account.owner, self.recipient)

    def test_creating_login_for_existing_party(self):
        response = self.post_json('/api/users/', {
            'party_id': self.recipient.pk, 'username': 'named-worker', 'password': 'pw12345678',
            'first_name': 'مریم', 'last_name': 'ب', 'role': 'WORKER',
        }, **self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(User.objects.get(username='named-worker').party, self.recipient)

    def test_user_delete_archives_without_destroying_party_receipts(self):
        user = User.objects.create_user(username='recipient-login', password='pw', party=self.recipient)
        response = self.client.delete(f'/api/users/{user.pk}', **self.auth)
        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertTrue(Party.objects.filter(pk=self.recipient.pk).exists())
