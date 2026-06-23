@echo off
REM Deploy homeup-media to Vercel production.
REM Prerequisite: In Vercel dashboard → homeup-media → Settings → General
REM set Root Directory to EMPTY (not "apps/media"), then run this script.

cd /d "%~dp0"
vercel deploy --prod --yes
