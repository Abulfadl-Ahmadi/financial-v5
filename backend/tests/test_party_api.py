"""Party/account API regression scenarios using isolated test database."""
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import Party, PartyKind, UserRole
from apps.financial.models import Account, Receipt
from apps.financial.ownership import register_card, get_user_party
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

    def test_only_owner_can_create_workshop_party(self):
        accountant = User.objects.create_user(username='accountant-test', password='pw', role=UserRole.ACCOUNTANT)
        token = str(RefreshToken.for_user(accountant).access_token)
        payload = {'display_name': 'کارگاه تازه', 'kind': 'WORKSHOP'}
        response = self.post_json('/api/users/parties', payload, HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.post_json('/api/users/parties', payload, **self.auth).status_code, 200)

    def test_worker_cannot_create_financial_receipt(self):
        worker_token = str(RefreshToken.for_user(self.worker).access_token)
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-ATTACK', 'date_jalali': '1405/01/01', 'amount': 1,
            'from_account_id': 1, 'to_account_id': 2,
        }, HTTP_AUTHORIZATION=f'Bearer {worker_token}')
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Receipt.objects.filter(tracking_code='T-ATTACK').exists())

    def test_financial_routes_reject_anonymous_and_worker(self):
        self.assertIn(self.client.get('/api/financial/accounts').status_code, (401, 403))
        worker_token = str(RefreshToken.for_user(self.worker).access_token)
        response = self.client.get('/api/financial/accounts', HTTP_AUTHORIZATION=f'Bearer {worker_token}')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(self.client.get('/api/financial/accounts', **self.auth).status_code, 200)

    def test_card_pan_is_masked_in_account_user_and_receipt_responses(self):
        account = Account.objects.create(card_number='6037997112345678', owner=self.recipient, f_name='مریم', l_name='ب')
        login = User.objects.create_user(username='masked-worker', password='pw', role=UserRole.WORKER,
                                         party=self.recipient, card_number=account.card_number)
        account.user = login
        account.save(update_fields=['user'])
        source = Account.objects.create(card_number='6104331122334455', owner=self.workshop,
                                        f_name='کارگاه', l_name='الف', is_workshop_account=True)
        Receipt.objects.create(tracking_code='MASKED', date_jalali='1405/01/01',
                               from_account=source, to_account=account, amount=10)
        paths = ['/api/financial/accounts', '/api/financial/receipts', '/api/users/',
                 f'/api/users/{login.pk}', f'/api/users/{login.pk}/accounts',
                 f'/api/users/{login.pk}/receipts', f'/api/users/parties/{self.recipient.pk}/accounts']
        for path in paths:
            with self.subTest(path=path):
                result = self.client.get(path, **self.auth)
                self.assertEqual(result.status_code, 200)
                self.assertNotIn(account.card_number, result.content.decode())
                self.assertNotIn(source.card_number, result.content.decode())
        body = self.client.get('/api/financial/accounts', **self.auth).json()
        self.assertEqual(next(row for row in body if row['id'] == account.pk)['last4'], '5678')

    def test_same_name_users_do_not_leak_receipts(self):
        user1 = User.objects.create_user(username='reza1', password='pw', first_name='رضا', last_name='محمدی', role=UserRole.WORKER)
        user2 = User.objects.create_user(username='reza2', password='pw', first_name='رضا', last_name='محمدی', role=UserRole.WORKER)
        card1 = register_card(party=get_user_party(user1), number='6037997112345671', first_name='رضا', last_name='محمدی')
        card2 = register_card(party=get_user_party(user2), number='6037997112345672', first_name='رضا', last_name='محمدی')
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        Receipt.objects.create(tracking_code='T-NAME-1', date_jalali='1405/01/01', from_account=source, to_account=card1, amount=100)

        res1 = self.client.get(f'/api/users/{user1.pk}/receipts', **self.auth)
        res2 = self.client.get(f'/api/users/{user2.pk}/receipts', **self.auth)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(len(res1.json()), 1)
        self.assertEqual(len(res2.json()), 0)

    def test_primary_card_source_of_truth_and_synchronization(self):
        user = User.objects.create_user(username='card-sync-user', password='pw', role=UserRole.WORKER)
        # Add two cards for the user party
        card_a = register_card(party=get_user_party(user), number='6037997112345671', primary=True)
        card_b = register_card(party=get_user_party(user), number='6037997112345672', primary=False)
        user.refresh_from_db()
        self.assertEqual(user.card_number, '6037997112345671')

        # Switch primary card to card B via account PUT API
        res = self.client.put(f'/api/financial/accounts/{card_b.pk}', data=json.dumps({
            'is_primary': True,
        }), content_type='application/json', **self.auth)
        self.assertEqual(res.status_code, 200)

        card_a.refresh_from_db()
        card_b.refresh_from_db()
        user.refresh_from_db()
        self.assertFalse(card_a.is_primary)
        self.assertTrue(card_b.is_primary)
        self.assertEqual(user.card_number, '6037997112345672')

        # Attempt to rewrite card PAN directly on account returns 409
        err = self.client.put(f'/api/financial/accounts/{card_b.pk}', data=json.dumps({
            'card_number': '6037997112345679',
        }), content_type='application/json', **self.auth)
        self.assertEqual(err.status_code, 409)

        # Attempt to change primary directly via user update returns 409
        err2 = self.client.put(f'/api/users/{user.pk}', data=json.dumps({
            'card_number': '6037997112345671',
        }), content_type='application/json', **self.auth)
        self.assertEqual(err2.status_code, 409)

    def test_personal_account_of_owner_or_accountant_is_not_workshop_paying_account(self):
        accountant = User.objects.create_user(username='acc-role-test', password='pw', role=UserRole.ACCOUNTANT)
        acc_token = str(RefreshToken.for_user(accountant).access_token)

        # Attempt to create an account for accountant party with is_workshop_account=True fails
        err = self.post_json('/api/financial/accounts', {
            'card_number': '6037997112345673',
            'f_name': 'حسابدار',
            'l_name': 'شخصی',
            'user_id': accountant.pk,
            'is_workshop_account': True,
        }, HTTP_AUTHORIZATION=f'Bearer {acc_token}')
        self.assertEqual(err.status_code, 409)

        # Create as regular personal account
        res = self.post_json('/api/financial/accounts', {
            'card_number': '6037997112345673',
            'f_name': 'حسابدار',
            'l_name': 'شخصی',
            'user_id': accountant.pk,
            'is_workshop_account': False,
        }, HTTP_AUTHORIZATION=f'Bearer {acc_token}')
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.json()['is_workshop'])

        # Fetching accounts shows is_workshop is False
        acc_obj = Account.objects.get(card_number='6037997112345673')
        self.assertFalse(acc_obj.is_workshop)

    def test_receipt_creation_keeps_party_snapshot(self):
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        dest = Account.objects.create(card_number='6104331122334455', owner=self.recipient, f_name='مریم', l_name='ب')
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-1', 'date_jalali': '1405/01/01', 'amount': 500,
            'from_account_id': source.pk, 'to_account_id': dest.pk,
        }, **self.auth)
        self.assertEqual(response.status_code, 200)
        receipt = Receipt.objects.get(pk=response.json()['id'])
        self.assertEqual(receipt.from_party, self.workshop)
        self.assertEqual(receipt.to_party, self.recipient)

    def test_edit_receipt_with_new_card_changes_destination(self):
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        original = Account.objects.create(card_number='6104331122334455', owner=self.recipient, f_name='مریم', l_name='ب')
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-EDIT', 'date_jalali': '1405/01/01', 'amount': 500,
            'from_account_id': source.pk, 'to_account_id': original.pk,
        }, **self.auth)
        self.assertEqual(response.status_code, 200)
        receipt_id = response.json()['id']
        updated = self.client.put(f'/api/financial/receipts/{receipt_id}', data=json.dumps({
            'new_to_card_number': '6037997112345679', 'party_id': self.recipient.pk,
        }), content_type='application/json', **self.auth)
        self.assertEqual(updated.status_code, 200)
        receipt = Receipt.objects.get(pk=receipt_id)
        self.assertEqual(receipt.to_account.card_number, '6037997112345679')
        self.assertEqual(receipt.to_party_id, self.recipient.pk)
        self.assertEqual(original.owner_id, self.recipient.pk)

    def test_existing_card_cannot_be_silently_claimed(self):
        account = Account.objects.create(card_number='6037997112345678', owner=self.recipient, f_name='مریم', l_name='ب')
        other = Party.objects.create(display_name='دیگری')
        response = self.post_json('/api/financial/accounts', {
            'card_number': account.card_number, 'f_name': 'دیگری', 'l_name': 'شخص', 'party_id': other.pk,
        }, **self.auth)
        self.assertEqual(response.status_code, 409)
        account.refresh_from_db()
        self.assertEqual(account.owner, self.recipient)

    def test_cannot_claim_other_party_card_via_user_accounts_api(self):
        account = Account.objects.create(card_number='6037997112345678', owner=self.recipient, f_name='مریم', l_name='ب')
        response = self.post_json(f'/api/users/{self.worker.pk}/accounts', {
            'card_number': account.card_number, 'f_name': 'کارگر', 'l_name': 'تست',
        }, **self.auth)
        self.assertEqual(response.status_code, 409)
        account.refresh_from_db()
        self.assertEqual(account.owner, self.recipient)

    def test_receipt_destination_can_be_party_without_login(self):
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-EXT', 'date_jalali': '1405/01/01', 'amount': 250,
            'from_account_id': source.pk, 'new_to_card_number': '6104331122334455',
            'party_id': self.recipient.pk,
        }, **self.auth)
        self.assertEqual(response.status_code, 200)
        destination = Account.objects.get(card_number='6104331122334455')
        self.assertEqual(destination.owner, self.recipient)
        self.assertIsNone(destination.user_id)
        self.assertEqual(Receipt.objects.get(pk=response.json()['id']).to_party_id, self.recipient.pk)

    def test_receipt_destination_cannot_claim_someone_elses_card(self):
        source = Account.objects.create(card_number='6037997112345678', owner=self.workshop, f_name='کارگاه', l_name='الف', is_workshop_account=True)
        card = Account.objects.create(card_number='6104331122334455', owner=self.recipient, f_name='مریم', l_name='ب')
        other = Party.objects.create(display_name='غیرمرتبط')
        response = self.post_json('/api/financial/receipts', {
            'tracking_code': 'T-BLOCK', 'date_jalali': '1405/01/01', 'amount': 250,
            'from_account_id': source.pk, 'new_to_card_number': card.card_number,
            'party_id': other.pk,
        }, **self.auth)
        self.assertEqual(response.status_code, 409)
        self.assertFalse(Receipt.objects.filter(tracking_code='T-BLOCK').exists())
        card.refresh_from_db()
        self.assertEqual(card.owner, self.recipient)

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
