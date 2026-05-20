import os
import shutil
import math
from tkinter import Tk, filedialog, messagebox

def get_folder_path(title_text):
    root = Tk()
    root.withdraw()  # Скрываем основное окно tkinter
    root.attributes('-topmost', True)  # Выводим окно выбора поверх других окон
    folder_path = filedialog.askdirectory(title=title_text)
    root.destroy()
    return folder_path

def prepare_files():
    # 1. Запрашиваем папки через GUI
    source_dir = get_folder_path("Выберите ИСХОДНУЮ папку с документами (где хаос)")
    if not source_dir:
        print("[-] Выбор исходной папки отменен.")
        return

    temp_dir = get_folder_path("Выберите или создайте ВРЕМЕННУЮ папку (куда разложить по 10 шт)")
    if not temp_dir:
        print("[-] Выбор временной папки отменен.")
        return

    # Поддерживаемые расширения
    valid_extensions = ('.pdf', '.docx', '.doc', '.txt', '.xlsx', '.xls', '.odt', '.rtf', '.png', '.jpg', '.jpeg')
    
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)

    all_files = []
    for root, dirs, files in os.walk(source_dir):
        # Исключаем временную папку, если она внутри исходной
        if os.path.commonpath([root, temp_dir]) == os.path.abspath(temp_dir):
            continue
        for file in files:
            if file.lower().endswith(valid_extensions):
                all_files.append(os.path.join(root, file))

    total_files = len(all_files)
    if total_files == 0:
        messagebox.showinfo("Результат", "В исходной папке не найдено подходящих документов.")
        return

    batch_size = 10
    num_batches = math.ceil(total_files / batch_size)

    # Копирование по батчам
    for i, file_path in enumerate(all_files):
        batch_num = (i // batch_size) + 1
        batch_folder = os.path.join(temp_dir, f"batch_{batch_num:03d}")
        
        if not os.path.exists(batch_folder):
            os.makedirs(batch_folder)
            
        file_name = os.path.basename(file_path)
        new_name = f"id_{i+1:04d}__{file_name}"
        
        dest_path = os.path.join(batch_folder, new_name)
        shutil.copy2(file_path, dest_path)
        
    messagebox.showinfo("Успех!", f"Найдено файлов: {total_files}\nРазбито на {num_batches} папок по 10 шт.\n\nВсе файлы скопированы во временную папку:\n{temp_dir}")

if __name__ == "__main__":
    prepare_files()