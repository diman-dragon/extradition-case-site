import os
import json
import shutil
import hashlib
from tkinter import Tk, filedialog, messagebox

def get_file_hash(file_path):
    """Вычисление SHA-256 хеша файла."""
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()

def get_folder_path(title_text):
    root = Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder_path = filedialog.askdirectory(title=title_text)
    root.destroy()
    return folder_path

def process_sorting():
    temp_dir = get_folder_path("1. Выберите ВРЕМЕННУЮ папку (с файлами)")
    if not temp_dir: return

    json_folder = get_folder_path("2. Выберите папку с JSON-ответами")
    if not json_folder: return

    target_dir = get_folder_path("3. Выберите ФИНАЛЬНУЮ папку")
    if not target_dir: return

    # Загружаем инструкции
    combined_instructions = {}
    for j_file in os.listdir(json_folder):
        if j_file.lower().endswith('.json'):
            with open(os.path.join(json_folder, j_file), 'r', encoding='utf-8') as f:
                combined_instructions.update(json.load(f))

    # Словарь для отслеживания обработанных хешей: {hash: original_filename}
    processed_hashes = {}
    processed_count = 0

    for root, _, files in os.walk(temp_dir):
        for file in files:
            if file in combined_instructions:
                file_src_path = os.path.join(root, file)
                file_hash = get_file_hash(file_src_path)
                
                info = combined_instructions[file]
                category = info.get('category', 'Разное').strip()
                new_date = info.get('date', '000000').strip()
                summary_title = info.get('summary_title', 'без_названия').strip()
                summary_text = info.get('summary', '').strip()

                # Очистка имен
                for char in r'<>:"/\|?*':
                    category = category.replace(char, '_')
                    summary_title = summary_title.replace(char, '_')

                category_dir = os.path.join(target_dir, category)
                if not os.path.exists(category_dir): os.makedirs(category_dir)

                # Проверка на дубликат по хешу
                if file_hash in processed_hashes:
                    prefix = "дубН_"
                    summary_text = f".дубН Дубликат файла {processed_hashes[file_hash]}\n" + summary_text
                else:
                    prefix = ""
                    processed_hashes[file_hash] = file # Запоминаем оригинал
                
                _, ext = os.path.splitext(file)
                final_name = f"{prefix}{new_date}_{summary_title}{ext}"
                
                shutil.copy2(file_src_path, os.path.join(category_dir, final_name))
                
                # Запись .txt файла
                with open(os.path.join(category_dir, f"{prefix}{new_date}_{summary_title}.txt"), 'w', encoding='utf-8') as sf:
                    sf.write(f"ДОКУМЕНТ: {final_name}\nКАТЕГОРИЯ: {category}\nДАТА: {new_date}\n" + "-"*20 + f"\n{summary_text}")
                
                processed_count += 1

    messagebox.showinfo("Готово", f"Обработано файлов: {processed_count}")

if __name__ == "__main__":
    process_sorting()