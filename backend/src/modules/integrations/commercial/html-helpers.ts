export function buildHtmlDocument(title: string, bodyContent: string, extraStyles = ''): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
    h2 { color: #334155; margin-top: 24px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
    th { background: #f8fafc; font-weight: 600; }
    ul { padding-left: 20px; }
    ${extraStyles}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}
