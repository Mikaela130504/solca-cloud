from html import escape
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import sqlite3

BASE = Path("/data")


def db_files():
    files = []
    for path in BASE.glob("*.sqlite"):
        if not path.is_file():
            continue
        try:
            with sqlite3.connect(path) as conn:
                tables = visible_tables(conn)
            if tables:
                files.append(path)
        except sqlite3.Error:
            continue
    return sorted(files, key=lambda p: p.name.lower())


def visible_tables(conn):
    return [
        r[0]
        for r in conn.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%' "
            "ORDER BY name"
        )
    ]


def safe_db(name):
    for path in db_files():
        if path.name == name:
            return path
    return db_files()[0] if db_files() else None


def query_rows(db_path, table):
    with sqlite3.connect(db_path) as conn:
        conn.row_factory = sqlite3.Row
        tables = visible_tables(conn)
        if table not in tables:
            table = tables[0] if tables else ""
        rows = []
        columns = []
        if table:
            quoted = '"' + table.replace('"', '""') + '"'
            rows = conn.execute(f"SELECT * FROM {quoted} LIMIT 200").fetchall()
            columns = rows[0].keys() if rows else [r[1] for r in conn.execute(f"PRAGMA table_info({quoted})")]
            if table == "auditorias":
                columns = [col for col in columns if col != "id"]
            if rows:
                columns = [
                    col for col in columns
                    if any(row[col] is not None and str(row[col]).strip() != "" for row in rows)
                ]
        return tables, table, columns, rows


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        db_path = safe_db(params.get("db", [""])[0])
        if not db_path:
            self.respond("<h1>SOLCA SQLite Viewer</h1><p>No hay bases SQLite montadas en /data.</p>")
            return
        tables, table, columns, rows = query_rows(db_path, params.get("table", [""])[0])
        db_links = " ".join(f'<a class="pill" href="/?db={escape(p.name)}">{escape(p.name)}</a>' for p in db_files())
        table_links = " ".join(f'<a class="pill" href="/?db={escape(db_path.name)}&table={escape(t)}">{escape(t)}</a>' for t in tables)
        header = "".join(f"<th>{escape(str(col))}</th>" for col in columns)
        body = "".join(
            "<tr>" + "".join(f"<td>{escape(str(row[col]) if row[col] is not None else '')}</td>" for col in columns) + "</tr>"
            for row in rows
        )
        html = f"""
        <h1>SOLCA SQLite Viewer</h1>
        <section><h2>Bases</h2>{db_links}</section>
        <section><h2>Tablas de {escape(db_path.name)}</h2>{table_links or '<p>Sin tablas.</p>'}</section>
        <section><h2>{escape(table or 'Sin tabla')}</h2>
          <div class="table-wrap"><table><thead><tr>{header}</tr></thead><tbody>{body}</tbody></table></div>
          <p>Se muestran máximo 200 registros.</p>
        </section>
        """
        self.respond(html)

    def respond(self, content):
        page = f"""<!doctype html>
        <html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>SOLCA SQLite Viewer</title>
        <style>
          body {{ font-family: Arial, sans-serif; margin: 0; background: #f3f7fb; color: #172033; }}
          h1 {{ margin: 0; padding: 20px 28px; background: #0e2f4a; color: white; }}
          section {{ margin: 18px 28px; padding: 18px; background: white; border: 1px solid #d8e2ee; border-radius: 8px; }}
          h2 {{ margin-top: 0; color: #0a4770; }}
          .pill {{ display: inline-block; margin: 4px; padding: 8px 10px; border: 1px solid #b9d8ea; border-radius: 999px; color: #0a4770; text-decoration: none; font-weight: 700; }}
          .table-wrap {{ overflow: auto; }}
          table {{ min-width: 100%; border-collapse: collapse; }}
          th, td {{ padding: 10px; border-bottom: 1px solid #e3ebf3; text-align: left; white-space: nowrap; }}
          th {{ background: #eef7fd; }}
        </style></head><body>{content}</body></html>"""
        encoded = page.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


ThreadingHTTPServer(("0.0.0.0", 8090), Handler).serve_forever()
