from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserRole

User = get_user_model()

class UsersModelAndApiTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_user",
            password="password123",
            first_name="مدیر",
            last_name="مجموعه",
            role=UserRole.OWNER,
            phone_number="09121111111"
        )
        self.cutter = User.objects.create_user(
            username="cutter_user",
            password="password123",
            first_name="رضا",
            last_name="مرادی",
            role=UserRole.CUTTING_SUPERVISOR,
            phone_number="09122222222"
        )

    def test_user_creation_and_roles(self):
        """Test User model creation and role assignment."""
        self.assertEqual(self.owner.role, UserRole.OWNER)
        self.assertEqual(self.cutter.role, UserRole.CUTTING_SUPERVISOR)
        self.assertIn("مدیر مجموعه", str(self.owner))
        self.assertIn("رضا مرادی", str(self.cutter))

    def test_user_login_api(self):
        """Test login Ninja API endpoint."""
        response = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "password123"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["role"], UserRole.OWNER)

    def test_invalid_login(self):
        """Test login with wrong password."""
        response = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "wrongpassword"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    def test_jwt_auth_get_current_user(self):
        """Test login token successfully authenticates GET /users/me."""
        login_res = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "password123"},
            content_type="application/json"
        )
        token = login_res.json()["access"]

        # Valid Bearer token succeeds
        me_res = self.client.get("/api/users/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["username"], "owner_user")

        # Anonymous request is rejected with 401
        anon_res = self.client.get("/api/users/me")
        self.assertEqual(anon_res.status_code, 401)

        # Invalid token is rejected with 401
        invalid_res = self.client.get("/api/users/me", HTTP_AUTHORIZATION="Bearer invalid-token")
        self.assertEqual(invalid_res.status_code, 401)

