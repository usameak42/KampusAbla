

## Generate Downloadable Okta CSV File

The issue is that pasting CSV text into Excel doesn't trigger delimiter parsing — Excel puts each line into a single cell. The fix is to generate an actual `.csv` file that Excel will open correctly with columns separated.

### What I'll Do

Write a Python script to create a proper UTF-8 CSV file at `/mnt/documents/okta_users_import.csv` with the correct Okta headers (`login`, `email`, `firstName`, `lastName`, `mobilePhone`) and all 9 user records. The file will use comma delimiters and include a UTF-8 BOM so Excel on Windows handles Turkish characters correctly.

### Files
- `/mnt/documents/okta_users_import.csv` — downloadable Okta-ready import file

