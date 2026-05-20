import os
import json
import re
from datetime import datetime
from tkinter import Tk, filedialog, messagebox, Button, Label, ttk, Frame, VERTICAL, RIGHT, Y, BOTH

class JsonSaverGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Контрольная панель сохранения батчей (Строгая цепочка)")
        self.root.geometry("680x580")
        self.root.attributes('-topmost', True)

        self.json_folder = ""

        # Шаг 1: Выбор папки
        self.label_title = Label(root, text="Шаг 1: Выберите папку для сохранения JSON файлов", font=("Arial", 10, "bold"))
        self.label_title.pack(pady=5)

        self.btn_select_dir = Button(root, text="📁 Выбрать папку назначения", command=self.choose_directory, bg="#2196F3", fg="white", font=("Arial", 10))
        self.btn_select_dir.pack(pady=5)

        self.label_info = Label(root, text="Папка не выбрана", fg="red", font=("Arial", 9, "italic"))
        self.label_info.pack(pady=5)

        # Статистика цепочки
        self.label_counter = Label(root, text="Диапазон цепочки: нет данных", fg="#333333", font=("Arial", 10, "bold"))
        self.label_counter.pack(pady=5)

        # Шаг 2: Действие
        self.label_step2 = Label(root, text="Шаг 2: Скопируйте ответ в чате и нажмите кнопку ниже", font=("Arial", 10, "bold"))
        self.label_step2.pack(pady=5)

        self.btn_paste = Button(root, text="📋 Вставить из буфера и Создать JSON", command=self.process_clipboard, bg="#4CAF50", fg="white", font=("Arial", 11, "bold"), padx=10, pady=8)
        self.btn_paste.pack(pady=5)

        # ТАБЛИЦА ЦЕПОЧКИ БАТЧЕЙ
        self.label_table_title = Label(root, text="Текущее состояние всей цепочки батчей (от первого до последнего):", font=("Arial", 9, "bold"))
        self.label_table_title.pack(pady=(10, 2), anchor="w", padx=20)

        table_frame = Frame(root)
        table_frame.pack(fill=BOTH, expand=True, padx=20, pady=5)

        style = ttk.Style()
        style.configure("Treeview", font=("Arial", 10), rowheight=25)
        style.configure("Treeview.Heading", font=("Arial", 10, "bold"))

        self.tree = ttk.Treeview(table_frame, columns=("file", "status", "info"), show="headings")
        self.tree.heading("file", text="Батч файл")
        self.tree.heading("status", text="Статус")
        self.tree.heading("info", text="Информация")

        self.tree.column("file", width=150, anchor="w")
        self.tree.column("status", width=120, anchor="center")
        self.tree.column("info", width=250, anchor="w")

        # Настройка цветов для тегов под разные статусы
        self.tree.tag_configure("success", foreground="white", background="#4CAF50") # Зеленый
        self.tree.tag_configure("missing", foreground="white", background="#F44336") # Красный

        scrollbar = ttk.Scrollbar(table_frame, orient=VERTICAL, command=self.tree.yview)
        self.tree.configure(yscrollcommand=scrollbar.set)

        self.tree.pack(side="left", fill=BOTH, expand=True)
        scrollbar.pack(side="right", fill=Y)

    def render_chain_table(self):
        """Сканирует папку, находит диапазон батчей и строит строгую таблицу"""
        # Очищаем таблицу перед перерисовкой
        for row in self.tree.get_children():
            self.tree.delete(row)

        if not self.json_folder or not os.path.exists(self.json_folder):
            return

        # Находим все файлы вида batch_XXX.json
        files = os.listdir(self.json_folder)
        batch_numbers = []
        file_data_map = {}

        for f in files:
            match = re.match(r'batch_(\d+)\.json', f, re.IGNORECASE)
            if match:
                num = int(match.group(1))
                batch_numbers.append(num)
                
                # Считаем сколько документов внутри файла для инфо
                try:
                    with open(os.path.join(self.json_folder, f), 'r', encoding='utf-8') as jf:
                        data = json.load(jf)
                        file_data_map[num] = f"{len(data)} док."
                except Exception:
                    file_data_map[num] = "Ошибка чтения"

        if not batch_numbers:
            self.label_counter.config(text="В папке пока нет сохраненных батчей", fg="blue")
            return

        # Определяем границы первого и последнего батча
        min_batch = min(batch_numbers)
        max_batch = max(batch_numbers)
        
        self.label_counter.config(text=f"Цепочка: от batch_{min_batch:03d} до batch_{max_batch:03d}", fg="#FF5722")

        # Заполняем таблицу СТРОГО по порядку без пропусков
        for b_num in range(min_batch, max_batch + 1):
            file_name = f"batch_{b_num:03d}.json"
            
            if b_num in batch_numbers:
                # Батч на месте - подсвечиваем ЗЕЛЕНЫМ
                doc_info = file_data_map.get(b_num, "ОК")
                self.tree.insert("", "end", values=(file_name, "Записан", doc_info), tags=("success",))
            else:
                # Батча не хватает в цепочке - подсвечиваем КРАСНЫМ
                self.tree.insert("", "end", values=(file_name, "ОТСУТСТВУЕТ", "Пропущен при сохранении!"), tags=("missing",))

    def choose_directory(self):
        selected_dir = filedialog.askdirectory(title="Выберите папку для сохранения JSON-ответов")
        if selected_dir:
            self.json_folder = selected_dir
            self.label_info.config(text=f"Сохраняем в: {self.json_folder}", fg="green", font=("Arial", 9, "bold"))
            self.render_chain_table()

    def process_clipboard(self):
        if not self.json_folder:
            messagebox.showwarning("Внимание", "Сначала выберите папку назначения (Шаг 1)!")
            return

        try:
            clipboard_text = self.root.clipboard_get()
        except Exception:
            messagebox.showwarning("Внимание", "Буфер обмена пуст.")
            return

        json_match = re.search(r'```json\s*(\{.*?\})\s*```', clipboard_text, re.DOTALL)
        if not json_match:
            json_match = re.search(r'(\{.*\})', clipboard_text, re.DOTALL)

        if not json_match:
            messagebox.showerror("Ошибка", "В буфере обмена не найден JSON-код.")
            return

        raw_json = json_match.group(1).strip()

        try:
            parsed_json = json.loads(raw_json)
        except json.JSONDecodeError as e:
            messagebox.showerror("Ошибка JSON", f"Нейросеть выдала битую структуру. Ошибка: {e}")
            return

        batch_filename = "converted_batch.json"
        if parsed_json:
            first_key = list(parsed_json.keys())[0]
            id_match = re.search(r'id_(\d+)__', first_key)
            if id_match:
                file_id = int(id_match.group(1))
                batch_num = ((file_id - 1) // 10) + 1
                batch_filename = f"batch_{batch_num:03d}.json"

        final_path = os.path.join(self.json_folder, batch_filename)
        with open(final_path, 'w', encoding='utf-8') as f:
            json.dump(parsed_json, f, ensure_ascii=False, indent=2)

        # Полностью перерисовываем сквозную таблицу контроля
        self.render_chain_table()

if __name__ == "__main__":
    main_root = Tk()
    app = JsonSaverGUI(main_root)
    main_root.mainloop()