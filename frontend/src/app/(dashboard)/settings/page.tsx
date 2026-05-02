"use client";

import { useEffect, useState } from "react";
import { getAccessToken, LMS_ACCESS_TOKEN_KEY } from "@/lib/api";

export default function SettingsPage() {
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(getAccessToken() ?? "");
  }, []);

  function save() {
    const t = token.trim();
    if (t) localStorage.setItem(LMS_ACCESS_TOKEN_KEY, t);
    else localStorage.removeItem(LMS_ACCESS_TOKEN_KEY);
    alert(t ? "Đã lưu token." : "Đã xóa token.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="odoo-card p-4">
        <h2 className="mb-2 text-[14px] font-semibold">Bearer token (Keycloak)</h2>
        <p className="mb-3 text-[12px] text-odoo-muted">
          Dán <code className="bg-odoo-canvas px-1">access_token</code> từ Keycloak (
          grant password / OIDC). Cần claim{" "}
          <code className="bg-odoo-canvas px-1">tenant_id</code> và quyền kho như luồng
          Postman.
        </p>
        <textarea
          className="odoo-input min-h-[120px] resize-y font-mono text-[12px]"
          placeholder="eyJ..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <button type="button" className="odoo-btn-primary" onClick={save}>
            Lưu token
          </button>
          <button
            type="button"
            className="odoo-btn-secondary"
            onClick={() => {
              setToken("");
              localStorage.removeItem(LMS_ACCESS_TOKEN_KEY);
            }}
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="odoo-card border-dashed bg-odoo-canvas/80 p-4 text-[12px] text-odoo-muted">
        <strong>Môi trường rewrite</strong>: file{" "}
        <code>.env.local</code> — biến{" "}
        <code className="rounded bg-white px-1">NEXT_PUBLIC_API_GATEWAY</code>
        và <code className="rounded bg-white px-1">API_GATEWAY_TARGET</code>
        (<code>5200</code> dotnet, <code>8000</code> Docker). Xem{" "}
        <code>.env.example</code>.
      </div>
    </div>
  );
}
