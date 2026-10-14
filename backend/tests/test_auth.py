def test_register_and_login(client):
    # Register user
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "tester@example.com",
        "full_name": "Test User",
        "password": "Password123!"
    })
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "tester@example.com"

    # Login user
    login_res = client.post("/api/v1/auth/login", json={
        "email": "tester@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data

def test_login_wrong_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "tester@example.com",
        "password": "WrongPassword!"
    })
    assert res.status_code == 401

def test_forgot_password_and_otp_reset(client, db_session):
    from app.models.password_reset import PasswordResetToken
    from app.models.user import User
    from app.core.security import get_password_hash
    import hashlib

    # Ensure user exists in db
    user = db_session.query(User).filter_by(email="reset_user@example.com").first()
    if not user:
        user = User(
            email="reset_user@example.com",
            full_name="Reset Tester",
            hashed_password=get_password_hash("OldPassword123!"),
            role="user",
            is_active=True
        )
        db_session.add(user)
        db_session.commit()

    # 1. Request OTP
    req_res = client.post("/api/v1/auth/forgot-password", json={
        "email": "reset_user@example.com"
    })
    assert req_res.status_code == 200

    # Retrieve created token from DB to test verification
    reset_record = db_session.query(PasswordResetToken).filter_by(email="reset_user@example.com", is_used=False).first()
    assert reset_record is not None

    # Simulate finding OTP: test with invalid OTP first
    bad_verify = client.post("/api/v1/auth/verify-otp", json={
        "email": "reset_user@example.com",
        "otp": "000000"
    })
    assert bad_verify.status_code == 400

    # Re-fetch record and force known OTP hash for deterministic testing
    test_otp = "842193"
    reset_record.otp_hash = hashlib.sha256(test_otp.encode()).hexdigest()
    reset_record.attempts = 0
    db_session.commit()

    # 2. Verify OTP
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "email": "reset_user@example.com",
        "otp": test_otp
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert "reset_token" in verify_data
    reset_token = verify_data["reset_token"]

    # 3. Reset password
    new_pass = "BrandNewSecretPass456!"
    reset_res = client.post("/api/v1/auth/reset-password", json={
        "email": "reset_user@example.com",
        "reset_token": reset_token,
        "new_password": new_pass,
        "confirm_password": new_pass
    })
    assert reset_res.status_code == 200

    # 4. Sign in with new password
    login_new = client.post("/api/v1/auth/login", json={
        "email": "reset_user@example.com",
        "password": new_pass
    })
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()

def test_avatar_upload_and_removal(client):
    # Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "avatar_user@example.com",
        "full_name": "Avatar User",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload avatar data URI
    fake_avatar = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res = client.put("/api/v1/auth/avatar", json={"avatar_url": fake_avatar}, headers=headers)
    assert res.status_code == 200
    assert res.json()["avatar_url"] == fake_avatar

    # Verify /auth/me reflects the avatar
    me = client.get("/api/v1/auth/me", headers=headers)
    assert me.status_code == 200
    assert me.json()["avatar_url"] == fake_avatar

    # Remove avatar
    res_clear = client.put("/api/v1/auth/avatar", json={"avatar_url": ""}, headers=headers)
    assert res_clear.status_code == 200
    assert res_clear.json()["avatar_url"] == ""

def test_social_links_and_totp_setup(client):
    import pyotp

    # Register user
    reg = client.post("/api/v1/auth/register", json={
        "email": "totp_social@example.com",
        "full_name": "Social User",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Update social links
    prof_res = client.put("/api/v1/auth/profile", json={
        "full_name": "Social User Updated",
        "github_url": "https://github.com/testuser",
        "linkedin_url": "https://linkedin.com/in/testuser",
        "twitter_url": "https://x.com/testuser",
        "website_url": "https://testuser.dev"
    }, headers=headers)
    assert prof_res.status_code == 200
    pdata = prof_res.json()
    assert pdata["github_url"] == "https://github.com/testuser"
    assert pdata["website_url"] == "https://testuser.dev"

    # 2. Setup TOTP and QR Code
    setup_res = client.post("/api/v1/auth/2fa/setup", headers=headers)
    assert setup_res.status_code == 200
    sdata = setup_res.json()
    assert "secret" in sdata
    assert "qr_code" in sdata
    assert sdata["qr_code"].startswith("data:image/png;base64,")
    assert "otpauth_url" in sdata
    secret = sdata["secret"]

    # 3. Confirm 2FA with generated TOTP code
    totp = pyotp.TOTP(secret)
    current_code = totp.now()

    confirm_res = client.post("/api/v1/auth/2fa/confirm", json={"code": current_code}, headers=headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["is_2fa_enabled"] is True

    # 4. Login now requires TOTP code
    login_res = client.post("/api/v1/auth/login", json={
        "email": "totp_social@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    ldata = login_res.json()
    assert ldata["requires_2fa"] is True
    temp_token = ldata["temp_token"]

    # 5. Verify 2FA using TOTP
    verify_res = client.post("/api/v1/auth/verify-2fa", json={
        "temp_token": temp_token,
        "otp": totp.now()
    })
    assert verify_res.status_code == 200
    assert "access_token" in verify_res.json()

    # 6. Disable 2FA
    dis_res = client.post("/api/v1/auth/2fa/disable", json={"code": totp.now()}, headers=headers)
    assert dis_res.status_code == 200
    assert dis_res.json()["is_2fa_enabled"] is False


def test_two_factor_auth_lifecycle(client, db_session):
    from app.models.password_reset import PasswordResetToken
    import hashlib

    # 1. Register a test user
    email = "twofa_user@example.com"
    pwd = "Secure2faPassword123!"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "2FA User",
        "password": pwd
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Toggle 2FA ON
    toggle_on = client.post("/api/v1/auth/toggle-2fa", json={"enable": True}, headers=headers)
    assert toggle_on.status_code == 200
    assert toggle_on.json()["is_2fa_enabled"] is True

    # 3. Log in with password -> must trigger 2FA requirement
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["requires_2fa"] is True
    assert "temp_token" in login_data
    temp_token = login_data["temp_token"]
    assert login_data["access_token"] is None

    # 4. Security bypass check: Temp token cannot access protected endpoints
    temp_headers = {"Authorization": f"Bearer {temp_token}"}
    bypass_try = client.get("/api/v1/auth/me", headers=temp_headers)
    assert bypass_try.status_code == 401

    # 5. Set known OTP code in DB
    twofa_record = db_session.query(PasswordResetToken).filter_by(email=email, is_used=False).order_by(PasswordResetToken.id.desc()).first()
    assert twofa_record is not None
    test_otp = "998877"
    twofa_record.otp_hash = hashlib.sha256(test_otp.encode()).hexdigest()
    db_session.commit()

    # 6. Verify with incorrect OTP
    bad_res = client.post("/api/v1/auth/verify-2fa", json={"temp_token": temp_token, "otp": "000000"})
    assert bad_res.status_code == 400

    # 7. Verify with correct OTP
    good_res = client.post("/api/v1/auth/verify-2fa", json={"temp_token": temp_token, "otp": test_otp})
    assert good_res.status_code == 200
    good_data = good_res.json()
    assert "access_token" in good_data
    assert good_data["requires_2fa"] is False
    full_token = good_data["access_token"]

    # 8. Full token accesses protected endpoints
    valid_headers = {"Authorization": f"Bearer {full_token}"}
    me_res = client.get("/api/v1/auth/me", headers=valid_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 9. Toggle 2FA OFF
    toggle_off = client.post("/api/v1/auth/toggle-2fa", json={"enable": False}, headers=valid_headers)
    assert toggle_off.status_code == 200
    assert toggle_off.json()["is_2fa_enabled"] is False

    # 10. Next login succeeds directly without 2FA
    login_direct = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert login_direct.status_code == 200
    assert login_direct.json()["requires_2fa"] is False
    assert "access_token" in login_direct.json()


