# Keycloak Setup Guide

> Hướng dẫn cài đặt Keycloak từ đầu khi reset Docker container hoặc database bị clear.

## Prerequisites

Docker container Keycloak đã chạy qua `docker-compose.local.yml`.

---

## Step 1: Đăng nhập Keycloak Admin

1. Mở trình duyệt: http://localhost:18080
2. Click **Administration Console**
3. Đăng nhập:
   - Username: `admin`
   - Password: `admin`

---

## Step 2: Tạo Realm

1. Góc trên trái → click vào dropdown "master" → **Create Realm**
2. Điền:
   - Realm name: `logistics_realm` ⚠️ (phải đúng tên này)
3. Click **Create**

> Realm này match với config trong `appsettings.json`:
> `http://localhost:18080/realms/logistics_realm`

---

## Step 3: Tạo Client

1. Trong realm `logistics_realm` → menu trái → **Clients** → **Create client**

### Tab General Settings:
- Client type: `OpenID Connect`
- Client ID: `oms-client` ⚠️ (phải đúng tên này)
- Click **Next**

### Tab Capability config:
- **Client authentication**: OFF (Public Client)
- **Authentication flow**: Tích chọn **Direct access grants**
- Click **Save**

### Tab Settings:
- **Valid redirect URIs**: `*` (test environment)
- Click **Save**

---

## Step 4: Tạo User

1. Menu trái → **Users** → **Add user**
2. Điền thông tin:
   - Username: `tester01` (hoặc tên bất kỳ)
   - Email, First Name, Last Name: tùy ý
3. Click **Create**

### Set Password:
1. Click vào user vừa tạo → tab **Credentials**
2. Click **Set password**
3. Điền:
   - Password: `123456`
   - Password confirmation: `123456`
   - **Temporary**: OFF ⚠️
4. Click **Save**

---

## Step 5: Test lấy Token

```powershell
# PowerShell
$body = @{
    grant_type = "password"
    client_id = "oms-client"
    username = "tester01"
    password = "123456"
}

Invoke-RestMethod -Method POST `
  -Uri "http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body $body
```

Hoặc curl:
```bash
curl -X POST "http://localhost:18080/realms/logistics_realm/protocol/openid-connect/token" ^
  -H "Content-Type: application/x-www-form-urlencoded" ^
  -d "grant_type=password" ^
  -d "client_id=oms-client" ^
  -d "username=tester01" ^
  -d "password=123456"
```

**Kết quả mong đợi:** JSON response chứa `access_token`

---

## Troubleshooting

| Lỗi | Nguyên nhân | Giải pháp |
|------|-------------|-----------|
| `invalid_grant` | Sai password hoặc Temporary = ON | Set password với Temporary: OFF |
| `Account is not fully set up` | Required user action pending | Xóa required actions trong user Attributes |
| `Realm does not exist` | Sai tên realm | Kiểm tra tên realm là `logistics_realm` |
| 401 Unauthorized | Client Authentication conflict | Đảm bảo Client Authentication = OFF |

---

## Port Mapping

| Port | Mô tả |
|------|--------|
| 8080 | Docker internal port (trong container) |
| 18080 | Host external port (trình duyệt truy cập) |

Document này đề cập port 8080 vì nó viết cho người hiểu Docker port mapping.
