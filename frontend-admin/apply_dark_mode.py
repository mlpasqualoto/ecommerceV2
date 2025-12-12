
import re
import os

files_to_process = [
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\admin\dashboard\page.jsx",
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\admin\products\page.jsx",
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\admin\reports\page.jsx",
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\admin\users\page.jsx",
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\login\page.jsx",
    r"c:\Users\Tabelionato Londrina\AppData\Roaming\scripts\ecommerceV2\frontend-admin\app\admin\layout.jsx"
]

replacements = [
    (r'bg-slate-50(?![\w-])', 'bg-slate-50 dark:bg-slate-900'),
    (r'bg-white(?![\w-])', 'bg-white dark:bg-slate-800'),
    (r'text-slate-900(?![\w-])', 'text-slate-900 dark:text-slate-100'),
    (r'text-slate-700(?![\w-])', 'text-slate-700 dark:text-slate-300'),
    (r'text-slate-600(?![\w-])', 'text-slate-600 dark:text-slate-400'),
    (r'text-slate-500(?![\w-])', 'text-slate-500 dark:text-slate-500'),
    (r'border-slate-200(?![\w-])', 'border-slate-200 dark:border-slate-700'),
    (r'border-slate-100(?![\w-])', 'border-slate-100 dark:border-slate-700'),
    (r'bg-slate-100(?![\w-])', 'bg-slate-100 dark:bg-slate-700'),
    (r'hover:bg-slate-50(?![\w-])', 'hover:bg-slate-50 dark:hover:bg-slate-700'),
    (r'hover:bg-slate-200(?![\w-])', 'hover:bg-slate-200 dark:hover:bg-slate-600'),
    (r'placeholder:text-slate-300(?![\w-])', 'placeholder:text-slate-300 dark:placeholder:text-slate-600'),
    (r'divide-slate-100(?![\w-])', 'divide-slate-100 dark:divide-slate-700'),
    
    # Specific colors
    (r'bg-blue-50(?![\w-])', 'bg-blue-50 dark:bg-blue-900/20'),
    (r'text-blue-700(?![\w-])', 'text-blue-700 dark:text-blue-300'),
    (r'border-blue-200(?![\w-])', 'border-blue-200 dark:border-blue-800'),
    
    (r'bg-emerald-50(?![\w-])', 'bg-emerald-50 dark:bg-emerald-900/20'),
    (r'text-emerald-700(?![\w-])', 'text-emerald-700 dark:text-emerald-300'),
    (r'border-emerald-200(?![\w-])', 'border-emerald-200 dark:border-emerald-800'),
    
    (r'bg-amber-50(?![\w-])', 'bg-amber-50 dark:bg-amber-900/20'),
    (r'text-amber-700(?![\w-])', 'text-amber-700 dark:text-amber-300'),
    (r'border-amber-200(?![\w-])', 'border-amber-200 dark:border-amber-800'),
    
    (r'bg-red-50(?![\w-])', 'bg-red-50 dark:bg-red-900/20'),
    (r'text-red-700(?![\w-])', 'text-red-700 dark:text-red-300'),
    (r'border-red-200(?![\w-])', 'border-red-200 dark:border-red-800'),
    
    (r'bg-green-50(?![\w-])', 'bg-green-50 dark:bg-green-900/20'),
    (r'text-green-700(?![\w-])', 'text-green-700 dark:text-green-300'),
    (r'border-green-200(?![\w-])', 'border-green-200 dark:border-green-800'),
    
    (r'bg-yellow-50(?![\w-])', 'bg-yellow-50 dark:bg-yellow-900/20'),
    (r'text-yellow-700(?![\w-])', 'text-yellow-700 dark:text-yellow-300'),
    (r'border-yellow-200(?![\w-])', 'border-yellow-200 dark:border-yellow-800'),
    
    (r'bg-orange-50(?![\w-])', 'bg-orange-50 dark:bg-orange-900/20'),
    (r'text-orange-700(?![\w-])', 'text-orange-700 dark:text-orange-300'),
    (r'border-orange-200(?![\w-])', 'border-orange-200 dark:border-orange-800'),
    
    (r'bg-indigo-50(?![\w-])', 'bg-indigo-50 dark:bg-indigo-900/20'),
    (r'text-indigo-700(?![\w-])', 'text-indigo-700 dark:text-indigo-300'),
    (r'border-indigo-200(?![\w-])', 'border-indigo-200 dark:border-indigo-800'),

    # Gradients
    (r'from-slate-50', 'from-slate-50 dark:from-slate-800'),
    (r'to-blue-50', 'to-blue-50 dark:to-slate-900'),
    (r'from-emerald-50', 'from-emerald-50 dark:from-emerald-900/20'),
    (r'to-green-50', 'to-green-50 dark:to-green-900/20'),
    (r'border-emerald-200', 'border-emerald-200 dark:border-emerald-800'),
    (r'bg-emerald-100', 'bg-emerald-100 dark:bg-emerald-900/40'),
    (r'text-emerald-600', 'text-emerald-600 dark:text-emerald-400'),
    
    # Icons
    (r'text-blue-600', 'text-blue-600 dark:text-blue-400'),
    (r'bg-blue-100', 'bg-blue-100 dark:bg-blue-900/40'),
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path} (not found)")
        continue
        
    print(f"Processing {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Dark mode classes applied successfully to all files.")
