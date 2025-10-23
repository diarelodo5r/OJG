<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;

class ImportSqlSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('sql/gestion_stock_dump.sql');
        if (!File::exists($path)) {
            throw new \RuntimeException("SQL dump not found at: $path");
        }

        // Read the dump content
        $rawSql = File::get($path);

        // Extract only data statements (INSERT/REPLACE) to avoid DDL errors on existing tables
        $statements = $this->extractDataStatements($rawSql);

        // Disable foreign key checks during import
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        foreach ($statements as $sql) {
            // Make INSERT statements idempotent by using INSERT IGNORE
            $normalized = preg_replace('/^\s*INSERT\s+INTO\s/i', 'INSERT IGNORE INTO ', $sql) ?? $sql;

            // Attempt to detect target table and transform timestamp column names in the column list
            $transformed = $this->mapDumpTimestamps($normalized);

            // Skip if the target table does not exist in current schema
            $table = $this->extractTargetTable($transformed);
            if ($table && !Schema::hasTable($table)) {
                // Table absent: skip this INSERT batch
                continue;
            }

            try {
                // Execute each INSERT/REPLACE statement individually
                DB::unprepared($transformed);
            } catch (\Throwable $e) {
                // If a specific statement fails due to column mismatch or other constraint,
                // continue with next statements to make the import best-effort.
                // You can log here if needed: logger()->warning('ImportSqlSeeder skip', ['error' => $e->getMessage()]);
                continue;
            }
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Extract only INSERT/REPLACE statements from a full MySQL/MariaDB dump.
     * This skips CREATE/ALTER/SET/TRANSACTION and any other DDL.
     *
     * @param string $sqlDump
     * @return array<int, string>
     */
    private function extractDataStatements(string $sqlDump): array
    {
        // Remove BOM if present
        $sql = preg_replace('/^\xEF\xBB\xBF/', '', $sqlDump) ?? $sqlDump;

        // Remove MySQL comments: -- comment, # comment, and /* ... */ including /*! ... */
        // Remove block comments first (including MySQL conditional comments)
        $sql = preg_replace('/\/\*![\s\S]*?\*\//m', '', $sql) ?? $sql;
        $sql = preg_replace('/\/\*[\s\S]*?\*\//m', '', $sql) ?? $sql;
        // Remove single-line comments starting with -- or #
        $sql = preg_replace('/^\s*--.*$/m', '', $sql) ?? $sql;
        $sql = preg_replace('/^\s*#.*$/m', '', $sql) ?? $sql;

        // Normalize line endings
        $sql = str_replace(["\r\n", "\r"], "\n", $sql);

        // Split statements on semicolon followed by newline or end of string.
        // This is sufficient for typical dumps which do not embed semicolons in values.
        $parts = preg_split('/;\s*(?:\n|$)/', $sql) ?: [];

        $dataStatements = [];
        foreach ($parts as $part) {
            $statement = trim($part);
            if ($statement === '') {
                continue;
            }

            // Keep only INSERT INTO or REPLACE INTO statements (case-insensitive)
            if (preg_match('/^\s*(INSERT|REPLACE)\s+INTO\s/i', $statement)) {
                // Re-append the semicolon removed by split
                $dataStatements[] = $statement.';';
            }
        }

        return $dataStatements;
    }

    /**
     * Replace dump's date_creation/date_modification with Laravel's created_at/updated_at
     * inside the column list of INSERT statements.
     */
    private function mapDumpTimestamps(string $insertSql): string
    {
        // Regex to capture: INSERT ... INTO `table` (col1, col2, ...) VALUES ...
        return preg_replace_callback(
            '/^(\s*(?:INSERT\s+IGNORE|INSERT|REPLACE)\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s*)\(([^)]*)\)/i',
            function ($m) {
                $prefix = $m[1];
                $cols = $m[3];
                // Replace backticked and non-backticked names uniformly
                $cols = preg_replace('/`date_creation`/i', '`created_at`', $cols) ?? $cols;
                $cols = preg_replace('/`date_modification`/i', '`updated_at`', $cols) ?? $cols;
                $cols = preg_replace('/\bdate_creation\b/i', 'created_at', $cols) ?? $cols;
                $cols = preg_replace('/\bdate_modification\b/i', 'updated_at', $cols) ?? $cols;
                return $prefix . '(' . $cols . ')';
            },
            $insertSql
        ) ?? $insertSql;
    }

    /**
     * Extract target table name from an INSERT/REPLACE statement.
     */
    private function extractTargetTable(string $insertSql): ?string
    {
        if (preg_match('/^\s*(?:INSERT\s+IGNORE|INSERT|REPLACE)\s+INTO\s+`?([a-zA-Z0-9_]+)`?/i', $insertSql, $mm)) {
            return $mm[1];
        }
        return null;
    }
}