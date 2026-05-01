# Generates complete Page-4 (actor <-> high-level use case) for PBL3.drawio
# Aligned with note/07-high-level-usecases-actors.md

PAGE4_XML = r'''  <diagram id="4unvbKszntSOWDEGnhQU" name="Page-4">
    <mxGraphModel dx="1400" dy="900" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2000" pageHeight="1200" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="p4-title" parent="1" style="text;html=1;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=0;fontStyle=1;fontSize=16;" value="Sơ đồ Use Case (mức nghiệp vụ) — LMS / 3PL&#xa;(Actors ↔ 14 use case cao từ 07-high-level-usecases-actors)" vertex="1">
          <mxGeometry x="40" y="8" width="920" height="44" as="geometry" />
        </mxCell>
        <mxCell id="p4-boundary" parent="1" style="rounded=0;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 8;strokeWidth=2;fillColor=#fafafa;strokeColor=#666666;fontStyle=1;fontSize=13;" value="&lt;div style=&quot;text-align:left&quot;&gt;&lt;b&gt;Hệ thống Quản lý Logistics (LMS)&lt;/b&gt;&lt;br/&gt;&lt;span style=&quot;font-weight:normal;font-size:11px&quot;&gt;Phạm vi: tương tác người — hệ thống (theo note 07)&lt;/span&gt;&lt;/div&gt;" vertex="1">
          <mxGeometry x="360" y="56" width="1580" height="1100" as="geometry" />
        </mxCell>
        <mxCell id="p4-a1" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Merchant / Chủ hàng" vertex="1">
          <mxGeometry x="40" y="72" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a2" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Khách nhận hàng" vertex="1">
          <mxGeometry x="40" y="128" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a3" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Admin" vertex="1">
          <mxGeometry x="40" y="184" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a4" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="NV điều phối đơn hàng" vertex="1">
          <mxGeometry x="40" y="240" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a5" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Nhân viên kho" vertex="1">
          <mxGeometry x="40" y="296" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a6" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Quản lý kho" vertex="1">
          <mxGeometry x="40" y="352" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a7" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="NV điều phối vận tải" vertex="1">
          <mxGeometry x="40" y="408" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a8" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Nhân viên CSKH" vertex="1">
          <mxGeometry x="40" y="464" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-a9" parent="1" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" value="Kế toán tài chính" vertex="1">
          <mxGeometry x="40" y="520" width="200" height="40" as="geometry" />
        </mxCell>
        <mxCell id="p4-u1" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="1) Quản lý đơn hàng&#xa;(tạo / xem / xác nhận / hủy)" vertex="1">
          <mxGeometry x="400" y="88" width="260" height="56" as="geometry" />
        </mxCell>
        <mxCell id="p4-u2" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="2) Lập kế hoạch nhập kho" vertex="1">
          <mxGeometry x="400" y="168" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u3" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="3) Tiếp nhận &amp; đối soát hàng nhập" vertex="1">
          <mxGeometry x="400" y="240" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u4" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="4) Cất hàng vào vị trí lưu trữ" vertex="1">
          <mxGeometry x="400" y="312" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u5" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="5) Quản lý tồn kho &amp; giữ chỗ tồn" vertex="1">
          <mxGeometry x="400" y="384" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u6" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="6) Lập kế hoạch xuất kho B2C" vertex="1">
          <mxGeometry x="720" y="88" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u7" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="7) Lập kế hoạch xuất kho B2B" vertex="1">
          <mxGeometry x="720" y="168" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u8" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="8) Đóng gói &amp; sẵn sàng giao" vertex="1">
          <mxGeometry x="720" y="240" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u9" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="9) Bàn giao VC &amp; cập nhật giao hàng" vertex="1">
          <mxGeometry x="720" y="312" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u10" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="10) Khởi tạo &amp; xử lý hoàn trả (RMA)" vertex="1">
          <mxGeometry x="720" y="384" width="260" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u11" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="11) Tra cứu trạng thái đơn / giao vận" vertex="1">
          <mxGeometry x="1040" y="88" width="280" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u12" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="12) Xử lý khiếu nại &amp; ngoại lệ SLA" vertex="1">
          <mxGeometry x="1040" y="168" width="280" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u13" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="13) Tính phí dịch vụ, COD, đối soát" vertex="1">
          <mxGeometry x="1040" y="240" width="280" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-u14" parent="1" style="ellipse;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;fontSize=11;" value="14) Theo dõi KPI vận hành" vertex="1">
          <mxGeometry x="1040" y="312" width="280" height="48" as="geometry" />
        </mxCell>
        <mxCell id="p4-note" parent="1" style="text;html=1;strokeColor=none;fillColor=#fff2cc;align=left;verticalAlign=top;whiteSpace=wrap;rounded=1;fontSize=11;" value="Ghi chú: Chi tiết UC-01..UC-50 và phụ thuộc xem note/09-usecase-chi-tiet-hop-nhat.md và backlog note/06-product-backlog-business-logic.vi.md." vertex="1">
          <mxGeometry x="400" y="480" width="1320" height="52" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a1-u1" edge="1" parent="1" source="p4-a1" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a1-u2" edge="1" parent="1" source="p4-a1" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u2">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a1-u11" edge="1" parent="1" source="p4-a1" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a1-u10" edge="1" parent="1" source="p4-a1" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a2-u11" edge="1" parent="1" source="p4-a2" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a2-u10" edge="1" parent="1" source="p4-a2" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a2-u12" edge="1" parent="1" source="p4-a2" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a3-u14" edge="1" parent="1" source="p4-a3" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a3-u11" edge="1" parent="1" source="p4-a3" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a4-u1" edge="1" parent="1" source="p4-a4" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u1">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a4-u6" edge="1" parent="1" source="p4-a4" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u6">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a4-u7" edge="1" parent="1" source="p4-a4" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u7">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a4-u11" edge="1" parent="1" source="p4-a4" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a5-u3" edge="1" parent="1" source="p4-a5" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u3">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a5-u4" edge="1" parent="1" source="p4-a5" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u4">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a5-u8" edge="1" parent="1" source="p4-a5" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u8">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a5-u10" edge="1" parent="1" source="p4-a5" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a6-u2" edge="1" parent="1" source="p4-a6" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u2">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a6-u5" edge="1" parent="1" source="p4-a6" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u5">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a6-u14" edge="1" parent="1" source="p4-a6" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a7-u9" edge="1" parent="1" source="p4-a7" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u9">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a7-u11" edge="1" parent="1" source="p4-a7" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a8-u11" edge="1" parent="1" source="p4-a8" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u11">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a8-u12" edge="1" parent="1" source="p4-a8" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a8-u10" edge="1" parent="1" source="p4-a8" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u10">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a9-u13" edge="1" parent="1" source="p4-a9" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u13">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a9-u12" edge="1" parent="1" source="p4-a9" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u12">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
        <mxCell id="p4-e-a9-u14" edge="1" parent="1" source="p4-a9" style="endArrow=none;html=1;strokeColor=#4a86e8;strokeWidth=1;" target="p4-u14">
          <mxGeometry relative="1" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>'''


def main() -> None:
    import re
    path = r"C:\Users\violet\Documents\MQF\Study Materials\Sixth Semester\PBL3\sources\logistics-management-website\tmp_PBL3.drawio.xml"
    out = r"C:\Users\violet\Documents\MQF\Study Materials\Sixth Semester\PBL3\sources\logistics-management-website\note\PBL3.drawio"
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()
    pattern = re.compile(
        r'<diagram id="4unvbKszntSOWDEGnhQU" name="Page-4">.*?</diagram>\s*',
        re.DOTALL,
    )
    new_text, n = pattern.subn(PAGE4_XML + "\n", text, count=1)
    if n != 1:
        raise SystemExit(f"Expected 1 Page-4 replacement, got {n}")
    with open(out, "w", encoding="utf-8") as f:
        f.write(new_text)
    print("Wrote", out)


if __name__ == "__main__":
    main()
