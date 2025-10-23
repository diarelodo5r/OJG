Place your MySQL/MariaDB dump file here.

Expected filename: gestion_stock_dump.sql

Example usage:
1) Copy your dump into this folder as: database/sql/gestion_stock_dump.sql
2) Ensure your .env points to a MySQL database (DB_CONNECTION=mysql)
3) Run: php artisan db:seed --class=Database\\Seeders\\ImportSqlSeeder

Notes:
- The seeder disables foreign key checks during the import and re-enables them afterwards.
- Recommended to import into a fresh database to avoid conflicts with existing tables.
