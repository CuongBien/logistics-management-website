# Skill: Refactor Code (Standards)

**Trigger:** Use this skill when asked to clean up code, improve readability, or during code review tasks.

## Principles

1.  **Boy Scout Rule:** "Leave the campground cleaner than you found it". Thấy code xấu thì sửa ngay (nếu nhỏ).
2.  **DRY (Don't Repeat Yourself):** Logic lặp lại > 2 lần -> Tách hàm/class.
3.  **SOLID:** Luôn đối chiếu 5 nguyên lý SOLID khi viết class mới.

## Review Checklist

- [ ] **Naming:** Tên biến/hàm có rõ nghĩa không? (Tránh `x`, `y`, `data`, `info`).
- [ ] **Function Size:** Hàm có dài quá 20 dòng không?
- [ ] **Complexity:** Có quá nhiều `if/else` lồng nhau không? (Dùng Guard Clauses để giảm nesting).
- [ ] **Magic Numbers:** Thay số cứng bằng `const` hoặc `enum`.
- [ ] **Comments:** Code có tự giải thích (`Self-documenting`) không? Chỉ comment _Tại sao_ (Why), không comment _Cái gì_ (What).
