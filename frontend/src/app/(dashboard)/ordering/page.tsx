"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

type ApiResult<T> = {
  isSuccess?: boolean;
  isFailure?: boolean;
  value?: T;
  error?: { code?: string; message?: string };
};

type CreateOrderBody = {
  tenantId: string;
  consignorId: string;
  skuCodes: string[];
  consignee: {
    fullName: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  codAmount: number;
  shippingFee: number;
  weight: number;
  note: string | null;
};

type OrderRow = {
  id: string;
  waybillCode?: string;
  status?: string;
  consignorId?: string;
  codAmount?: number;
};

function unwrapOrder(res: unknown): OrderRow | null {
  if (!res || typeof res !== "object") return null;
  const r = res as ApiResult<Record<string, unknown>>;
  const inner =
    r.value && typeof r.value === "object"
      ? (r.value as Record<string, unknown>)
      : (res as Record<string, unknown>);
  const id = inner.id;
  if (!id) return null;
  return {
    id: String(id),
    waybillCode: inner.waybillCode as string | undefined,
    status: inner.status as string | undefined,
    consignorId: inner.consignorId as string | undefined,
    codAmount: inner.codAmount as number | undefined,
  };
}

function unwrapCreateId(res: unknown): string | null {
  if (!res || typeof res !== "object") return null;
  const r = res as ApiResult<string>;
  if (r.value !== undefined && r.value !== null)
    return String(r.value);
  const o = res as Record<string, unknown>;
  if (typeof o.value === "string") return o.value;
  return null;
}

export default function OrderingPage() {
  const [orderId, setOrderId] = useState("");
  const [tenantId, setTenantId] = useState("default-tenant");
  const [consignorId, setConsignorId] = useState("dev-user");
  const [sku, setSku] = useState("SKU-RED-TSHIRT");

  const q = useQuery({
    queryKey: ["order", orderId],
    queryFn: () =>
      apiFetch<unknown>(`/api/Orders/${orderId}`, { service: "oms" }),
    enabled: orderId.length > 10,
  });

  const create = useMutation({
    mutationFn: () => {
      const body: CreateOrderBody = {
        tenantId,
        consignorId,
        skuCodes: [sku.trim()].filter(Boolean),
        consignee: {
          fullName: "Nguyễn Văn A",
          phone: "0901234567",
          address: {
            street: "123 Nguyễn Trãi",
            city: "TP.HCM",
            state: "HCM",
            country: "Vietnam",
            zipCode: "70000",
          },
        },
        codAmount: 500_000,
        shippingFee: 35_000,
        weight: 1.5,
        note: "Tạo từ LMS web",
      };
      return apiFetch<unknown>("/api/Orders", {
        method: "POST",
        body: JSON.stringify(body),
        service: "oms",
      });
    },
    onSuccess: (data) => {
      const id = unwrapCreateId(data);
      if (id) setOrderId(id);
    },
  });

  const row = q.data ? unwrapOrder(q.data) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="odoo-card p-4">
        <h2 className="mb-3 text-[14px] font-semibold text-odoo-text">
          Tạo đơn hàng
        </h2>
        <p className="mb-3 text-[12px] text-odoo-muted">
          Token phải có <code className="rounded bg-odoo-canvas px-1">tenant_id</code>{" "}
          khớp Tenant. Server vẫn ghi đè consignor từ{" "}
          <code className="rounded bg-odoo-canvas px-1">sub</code> nếu cấu hình
          giống API gốc.
        </p>
        <div className="space-y-2">
          <div>
            <label className="odoo-label">tenantId (body)</label>
            <input
              className="odoo-input"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            />
          </div>
          <div>
            <label className="odoo-label">consignorId (body)</label>
            <input
              className="odoo-input"
              value={consignorId}
              onChange={(e) => setConsignorId(e.target.value)}
            />
          </div>
          <div>
            <label className="odoo-label">SKU</label>
            <input className="odoo-input" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <button
            type="button"
            className="odoo-btn-primary mt-2"
            disabled={create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "Đang gửi…" : "Tạo đơn"}
          </button>
          {create.isError && (
            <p className="mt-2 text-[12px] text-red-600">
              {(create.error as Error).message}
            </p>
          )}
        </div>
      </div>

      <div className="odoo-card p-4">
        <h2 className="mb-3 text-[14px] font-semibold text-odoo-text">
          Tra cứu đơn theo Id
        </h2>
        <div className="flex gap-2">
          <input
            className="odoo-input"
            placeholder="Order Guid"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.trim())}
          />
        </div>
        {q.isFetching && (
          <p className="mt-2 text-[12px] text-odoo-muted">Đang tải…</p>
        )}
        {q.isError && (
          <p className="mt-2 text-[12px] text-red-600">
            {(q.error as Error).message}
          </p>
        )}
        {row && (
          <table className="odoo-table mt-4">
            <tbody>
              <tr>
                <th className="w-36">Id</th>
                <td className="font-mono text-[12px]">{row.id}</td>
              </tr>
              <tr>
                <th>Waybill</th>
                <td>{row.waybillCode ?? "—"}</td>
              </tr>
              <tr>
                <th>Trạng thái</th>
                <td>{row.status ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
