@echo off
cd /d "C:\Users\Muhammad Midhat\kalshi-quant-trader_by_Midhat\backend"
call venv\Scripts\activate.bat
python ..\scripts\collect_snapshots.py >> ..\scripts\collector_log.txt 2>&1