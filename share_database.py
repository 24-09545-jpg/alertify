"""Copy this computer's ALERTIFY database into database/ so it can be shared via GitHub.

Run:   python share_database.py
Then:  git add database/alertify.db && git commit -m "Update shared database" && git push

On another computer, delete its instance/alertify.db (if any) and start the app:
it copies database/alertify.db in automatically on first run, with the same
accounts, reports and admin changes.

Note: the GitHub repository is public. Passwords are stored only as hashes,
but anyone can download the accounts' names, emails and reports.
"""
import os
import sqlite3

from app import LOCAL_DB, SHARED_DB


def share_database(src=LOCAL_DB, dest=SHARED_DB):
    """Write a consistent copy of src to dest using SQLite's backup API.

    The backup API is safe even while the app is running, unlike copying the file.
    Returns a dict of row counts for a few tables, as a quick summary.
    """
    if not os.path.exists(src):
        raise SystemExit(f"No local database at {src}. Run the app once first.")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with sqlite3.connect(src) as source, sqlite3.connect(dest) as target:
        source.backup(target)
        counts = {t: target.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
                  for t in ("users", "disaster_reports", "evacuation_centers", "notifications")}
    return counts


if __name__ == "__main__":
    summary = share_database()
    print(f"Shared database saved to {SHARED_DB}")
    for table, n in summary.items():
        print(f"{n:>5}  {table}")
