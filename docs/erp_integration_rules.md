# ERP Integration Rules (Agreed)

## 1) Strategic Direction
- Chon huong B lam chinh: OMS/WMS la he thong van hanh chu dong.
- Khong de ERP chi phoi toan bo domain van hanh noi bo.
- Co the dung hybrid B+: ERP lam master cho mot so du lieu tham chieu (vd: SKU), nhung warehouse operations van do he thong quan ly.

## 2) Source of Truth
- ERP la source-of-truth cho master data da duoc chot contract (toi thieu: SKU; warehouse can xem theo chinh sach tung tenant).
- OMS/WMS khong goi ERP runtime trong business flow; su dung local mirror de validate.
- Du lieu van hanh (inbound/outbound/inventory/bin/zone/block) thuoc he thong noi bo.

## 3) Service Boundary Rules
- Khong cross-service foreign key giua OMS, WMS, ERP.
- Moi service co mirror bang rieng theo bounded context.
- Khong dung shared database lam contract giua cac service.

## 4) Sync Rules
- Dong bo theo cursor/checkpoint, co the resume.
- Upsert idempotent theo tenant + entity + erp id + updated_at_erp.
- Commit checkpoint sau khi batch thanh cong.
- Loi sync phai explicit, khong fallback im lang.

## 5) Validation and Enforcement Rules
- Validation nghiep vu phai dua tren local mirror.
- Missing mapping => tra domain/business error ro rang.
- Theo huong B, WMS khong hard-gate van hanh kho bang `erp_warehouses` neu warehouse duoc noi bo quan ly.
- SKU mapping validation duoc giu de dam bao tham chieu hang hoa nhat quan.

## 6) Tenant Isolation Rules
- Moi ban ghi mirror va business data lien quan phai co tenant/customer ownership.
- Moi query va validation phai scope theo tenant.
- Token tenant phai khop voi tenant trong du lieu.

## 7) Rollout and Safety Rules
- Shadow mode truoc, sau do tang dan strict enforcement.
- Theo doi sync lag/failure theo tenant va entity.
- Dung feature flags de ha muc do strict tam thoi khi can.

## 8) API/Contract Rules
- Canonical DTO cua he thong phai on dinh.
- Khong de ERP vendor schema leak truc tiep vao domain logic.
- Adapter/mapping layer la noi hap thu khac biet field giua cac doanh nghiep/ERP connector.

## 9) Current Decision Snapshot
- Da thong nhat: uu tien mo hinh B.
- Da dieu chinh: bo hard-gate `erp_warehouses` trong WMS create receipt va sort flow.
- Huong tiep theo khuyen nghi: tiep tuc toi uu hybrid B+ (giu mirror SKU, giam rang buoc warehouse tu ERP neu khong can).
