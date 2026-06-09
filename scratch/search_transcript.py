import json
import sys

TRANSCRIPT_PATH = r"C:\Users\Victus\.gemini\antigravity\brain\f42b5dfe-12aa-4c69-b74a-c7893fd0471e\.system_generated\logs\transcript.jsonl"
OUTPUT_PATH = r"d:\Logistics\scratch\search_results.txt"

def main():
    print("Searching transcript for 'Phase 7'...")
    matches = 0
    with open(TRANSCRIPT_PATH, 'r', encoding='utf-8', errors='ignore') as f, open(OUTPUT_PATH, 'w', encoding='utf-8') as out:
        for idx, line in enumerate(f):
            if any(term in line.lower() for term in ['phase 7', 'cycle count', 'hoàn hàng', 'rto', 'disposition']):
                try:
                    data = json.loads(line)
                    out.write(f"Line {idx} - Type: {data.get('type')}, Source: {data.get('source')}\n")
                    content = data.get('content', '')
                    if content:
                        out.write(f"Content: {content}\n")
                    else:
                        out.write(f"Tool calls: {json.dumps(data.get('tool_calls'), indent=2, ensure_ascii=False)}\n")
                    out.write("-" * 80 + "\n")
                    matches += 1
                except Exception as e:
                    out.write(f"Line {idx} - Parse Error: {e}\n")
    print(f"Total matches found: {matches}. Results written to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
