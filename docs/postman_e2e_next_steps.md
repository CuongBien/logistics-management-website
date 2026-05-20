# E2E Testing with Postman: Execution Guide

Now that the 404 error and API routes are resolved, you can successfully run the **Inbound Exception Flow** E2E test.

Here are the specific next steps to execute the test suite locally.

## 1. Start the Environment

To ensure consistency and avoid port conflicts, start all services (infrastructure and core APIs) exclusively inside Docker. Do not use local terminal `dotnet run` instances.

```bash
cd deploy/docker
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d --build
```

## 2. Configure Postman Environment
Ensure you have a Postman Environment selected with the following variables:
- `keycloak_url`: `http://localhost:18080` (or `http://localhost:8080` depending on your docker-compose bindings)
- `oms_url`: `http://localhost:8000/api/ordering` (API Gateway route to Ordering)
- `wms_url`: `http://localhost:8000/api/warehouse` (API Gateway route to Warehouse)
- `username`: A valid user (e.g., `admin`)
- `password`: The user's password (e.g., `admin`)

## 3. Run the Collection Sequence

In Postman, open the **Inbound Exception Flow (Fixed Order)※** collection. Execute the requests in the exact order below:

### Step -1: Login to Keycloak
- **Action**: Execute the login request.
- **Expected Result**: 200 OK. Authenticates with Keycloak and automatically sets the `token` variable in your collection variables.

### Step 0: Setup Dev IAM
- **Action**: Execute the `setup-admin` endpoint.
- **Expected Result**: 200 OK. Returns `{"message": "Admin rights granted for all warehouses.", "operatorSub": "..."}`. This seeds the DB so you don't get 403 Forbidden later.

### Step 1: Create Order (Ordering)
- **Action**: Run the "Create Order" request.
- **Expected Result**: 200/201 OK. A new order is generated in the OMS. The `orderId` is automatically saved to collection variables.

### Step 1b: Pickup (Ordering)
- **Action**: Run the "Pickup" request.
- **Expected Result**: 200 OK. The order transitions to the `PickedUp` state in the Ordering service.

### Step 2a: Create Receipt (Warehouse)
- **Action**: Run the "Create Receipt" request.
- **Expected Result**: 200 OK. Generates an expected inbound record in the Warehouse service, linking it to the newly created order. The `receiptId` is saved to variables.

### Step 1: Receive Partial Items (Warehouse)
- **Action**: Run the `/receive` endpoint request inside the Warehouse folder.
- **Expected Result**: 200 OK. Successfully receives items into the warehouse.

### Step 2: Force Close (Warehouse)
- **Action**: Run the `/force-close` endpoint request.
- **Expected Result**: 200 OK. Triggers an inventory discrepancy exception since only partial items were received. The WMS publishes an integration event to RabbitMQ to notify the OMS.

### Step 3: Check Order Status (Ordering)
- **Action**: Run the GET order endpoint.
- **Expected Result**: 200 OK. The `status` field in the response should now be `AwaitingResolution`, confirming that the OMS successfully consumed the RabbitMQ event from the WMS.

### Step 4: Resolve Exception (Ordering)
- **Action**: Run the resolution endpoint (either `AcceptPartial` or `CancelAndReturn`).
- **Expected Result**: 200 OK. Successfully transitions the Order state from `AwaitingResolution` to `InWarehouse` (if accepting partial) or `Cancelled` (if rejecting). 

## 4. Verification and Observability

If any step fails, use the local infrastructure tools to diagnose:
1. **Seq (Logs)**: `http://localhost:8081` - Check for application exceptions or failed validation logic.
2. **RabbitMQ**: `http://localhost:15672` (lms/lms123) - Verify that the `inventory-discrepancy` integration events are being published by WMS and consumed by OMS.
3. **Jaeger (Tracing)**: `http://localhost:16686` - Trace requests across the API Gateway, OMS, and WMS to see exactly where latency or failures occur.

## Troubleshooting
- If you encounter a `404 Not Found` in Postman despite the URL being correct, check if there is a **stale Saved Example** under the request tab. Deleting the saved example and re-sending often fixes Postman UI caching issues.
- If Newman fails with `ENOTFOUND {{keycloak_url}}`, it means your Postman Environment variables are missing. Be sure to export your environment to a JSON file and run:
  ```bash
  npx newman run docs/postman/Inbound_Exception_Flow.postman_collection.json -e docs/postman/Local_Environment.postman_environment.json
  ```
