import pandas as pd
import json
import os

file_path = 'd:/Template/russian-lang/violations_2026-03-06.xlsx'
if not os.path.exists(file_path):
    print(f"Error: File {file_path} not found")
else:
    try:
        df = pd.read_excel(file_path)
        info = {
            "columns": df.columns.tolist(),
            "row_count": len(df),
            "sample": df.head(15).to_dict(orient='records'),
            "types_summary": df['Тип'].value_counts().to_dict() if 'Тип' in df.columns else "Type column missing"
        }
        print(json.dumps(info, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"Error reading file: {e}")
