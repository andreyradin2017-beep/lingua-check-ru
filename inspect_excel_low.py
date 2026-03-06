import zipfile
import xml.etree.ElementTree as ET

file_path = 'd:/Template/russian-lang/violations_2026-03-06.xlsx'

try:
    with zipfile.ZipFile(file_path, 'r') as z:
        # Read the shared strings to map IDs to text
        with z.open('xl/sharedStrings.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            shared_strings = [node.text for node in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')]
        
        # Read the first sheet
        with z.open('xl/worksheets/sheet1.xml') as f:
            tree = ET.parse(f)
            root = tree.getroot()
            rows = []
            # Find rows
            for row_node in root.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')[:20]: # First 20 rows
                cells = []
                for cell_node in row_node.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v'):
                    val = cell_node.text
                    # If it's a shared string (checked by t="s" on parent cell but here we just try to map)
                    # This is simple but might be wrong for numbers. 
                    # Let's just print a few values to see.
                    cells.append(val)
                rows.append(cells)
                
    print(f"Total shared strings: {len(shared_strings)}")
    print(f"Sample shared strings: {shared_strings[:50]}")
    # Group shared strings by type to see counts
    types = {}
    for s in shared_strings:
        if s in ["unrecognized_word", "Товарный знак", "Иностранное слово", "Нарушение: нет дубля", "Визуальное доминирование"]:
            types[s] = types.get(s, 0) + 1
    print(f"Types found in shared strings: {types}")

except Exception as e:
    print(f"Error: {e}")
