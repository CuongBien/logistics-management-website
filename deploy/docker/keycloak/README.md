# Keycloak Realm Provisioning Guide

This directory contains the Keycloak realm configuration for the Logistics Management System.

## Quick Start: Manual Import (Recommended for First-Time Setup)

### Step 1: Access Keycloak Admin Console
1. Ensure your Docker stack is running:
   ```powershell
   cd deploy\docker
   docker-compose -f docker-compose.local.yml ps
   ```

2. Open Keycloak Admin Console: http://localhost:18080
   - Username: `admin`
   - Password: `admin`

### Step 2: Import the Realm
1. In the Keycloak Admin Console, hover over the realm dropdown (top-left, currently shows "master")
2. Click **"Create Realm"** or **"Add realm"**
3. Click **"Browse"** and select: `deploy/docker/keycloak/logistics-realm.json`
4. Click **"Create"**

### Step 3: Verify the Import
1. Switch to the `logistics_realm` realm using the dropdown (top-left)
2. Navigate to **"Clients"** → Verify `oms-client` exists
3. Navigate to **"Users"** → Verify `tester01` exists
4. Click on `tester01` → **"Credentials"** tab → Verify password is set (you should see "Password" type listed)

### Step 4: Test Authentication
Run your Postman collection. The login step should now succeed with:
- Username: `tester01`
- Password: `admin`
- Keycloak URL: `http://localhost:18080`

---

## Automated Import (Optional - For CI/CD)

To automatically import the realm when Keycloak starts, modify `docker-compose.local.yml`:

```yaml
keycloak:
  image: quay.io/keycloak/keycloak:23.0
  container_name: lms-keycloak
  command:
    - start-dev
    - --import-realm  # Add this line
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
  volumes:
    - ./keycloak:/opt/keycloak/data/import:ro  # Add this line
  ports:
    - "18080:8080"
  networks:
    - lms-network
```

Then restart Keycloak:
```powershell
docker-compose -f docker-compose.local.yml restart keycloak
```

---

## Realm Configuration Details

### Realm: `logistics_realm`
- **Token Lifespan**: 1 hour (3600s)
- **SSO Session Timeout**: 30 minutes idle, 10 hours max
- **SSL**: Disabled for local development

### Client: `oms-client`
- **Type**: Public (no client secret required)
- **Flows Enabled**:
  - Direct Access Grants (for Postman password flow)
  - Standard Flow (for web app authorization code flow)
- **Redirect URIs**: Configured for all local development ports
- **CORS**: Wildcard enabled for local development

### User: `tester01`
- **Password**: `admin` (non-temporary)
- **Email**: `tester01@logistics.local`
- **Roles**: `operator`, `manager`, `admin`

### Realm Roles
- **operator**: Basic warehouse operator
- **manager**: Warehouse manager with elevated permissions
- **admin**: System administrator with full access

---

## Troubleshooting

### "Invalid user credentials" error
- Verify the realm is imported and active
- Verify the user `tester01` exists in the `logistics_realm` (not in `master` realm)
- Verify the password is set correctly (check Credentials tab)

### "Realm does not exist" error
- Ensure you're using the correct Keycloak URL in Postman: `http://localhost:18080`
- Verify the realm name is exactly `logistics_realm` (case-sensitive)

### Token validation fails in API
- Check that the API services are configured with the correct issuer URLs
- Verify the services can reach Keycloak at `http://keycloak:8080` (internal Docker network)

---

## Next Steps After Import

1. **Run Postman Collection**: The authentication step should now succeed
2. **Setup Admin Permissions**: After first successful login, call `POST /api/dev/account/setup-admin` to auto-provision full permissions
3. **Verify E2E Flow**: Run the complete `Inbound_Exception_Flow` collection

For detailed RBAC testing, see: `docs/iam-rbac-testing-guide.md`
