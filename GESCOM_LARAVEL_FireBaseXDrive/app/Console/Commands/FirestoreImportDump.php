<?php

namespace App\Console\Commands;

use App\Services\Firebase\FirestoreService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class FirestoreImportDump extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:firestore-import-dump {--path=database/sql/gestion_stock_dump.sql} {--dry-run} {--truncate}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importe un dump SQL dans Firestore en préservant les identifiants.';

    private array $tableCollectionMap = [
        'articles' => 'articles',
        'fournisseurs' => 'fournisseurs',
        'clients' => 'clients',
        'familles' => 'familles',
        'utilisateurs' => 'utilisateurs',
        'stock' => 'stocks',
        'archives' => 'archives',
        'historiques' => 'historiques',
        'historique_prix_achat' => 'historique_prix_achat',
        'historique_prix_vente' => 'historique_prix_vente',
        'historique_quantite_standard' => 'historique_quantite_standard',
        'ventes' => 'ventes',
    ];

    public function __construct(private readonly FirestoreService $firestore)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->option('path');
        $dryRun = (bool) $this->option('dry-run');
        $truncate = (bool) $this->option('truncate');
        $filePath = base_path($path);

        if (!File::exists($filePath)) {
            $this->error("Fichier introuvable : {$filePath}");
            return 1;
        }

        // Initialiser les collections Drive/Firestore
        if (!$dryRun) {
            $this->info('Initialisation des collections dossiers et contenus...');
            $this->initializeDriveCollections();
        }

        $sqlDump = File::get($filePath);
        $tables = $this->parseSqlDump($sqlDump);

        if (empty($tables)) {
            $this->error('Aucune donnée INSERT trouvée dans le dump SQL.');
            return 1;
        }

        if ($truncate && $dryRun) {
            $this->warn('Option --truncate ignorée en mode --dry-run.');
        }

        if ($truncate && !$dryRun) {
            $this->info('Suppression des collections avant import.');
            $this->truncateCollections(array_values($this->tableCollectionMap));
        }

        $report = [];
        $errors = [];

        foreach ($this->tableCollectionMap as $table => $collection) {
            $rows = $tables[$table] ?? [];
            $this->info("Traitement de la table {$table} vers la collection {$collection}.");

            if (empty($rows)) {
                $report[$collection] = ['count' => 0, 'errors' => 0];
                continue;
            }

            $documents = array_map(fn (array $row) => $this->transformRow($table, $row), $rows);

            if ($dryRun) {
                foreach ($documents as $document) {
                    $id = (string) ($document['id'] ?? '');
                    $preview = $this->buildDryRunPreview($table, $document);
                    $this->line(sprintf('[%s] Dry run: id=%s%s', $collection, $id, $preview !== '' ? " | {$preview}" : ''));
                }
                $report[$collection] = ['count' => count($documents), 'errors' => 0];
                continue;
            }

            $imported = 0;

            foreach ($documents as $document) {
                $id = (string) ($document['id'] ?? '');

                if ($id === '') {
                    $errors[$collection][] = 'Identifiant manquant';
                    continue;
                }

                $payload = $document;
                unset($payload['id']);

                try {
                    $this->firestore->createDocument($collection, $payload, $id);
                    $imported++;
                } catch (Throwable $exception) {
                    $errors[$collection][] = $exception->getMessage();
                }
            }

            $report[$collection] = ['count' => $imported, 'errors' => count($errors[$collection] ?? [])];
        }

        foreach ($report as $collection => $stats) {
            $summary = sprintf('%s : %d documents', $collection, $stats['count']);

            if ($stats['errors'] > 0) {
                $summary .= sprintf(' (%d erreurs)', $stats['errors']);
            }

            $this->line($summary);
        }

        if (!$dryRun && !empty($errors)) {
            $this->error('Des erreurs sont survenues pendant l\'import.');
            return 2;
        }

        $this->info($dryRun ? 'Analyse en mode dry-run terminée.' : 'Import Firestore terminé avec succès.');
        return 0;
    }

    private function parseSqlDump(string $sqlDump): array
    {
        $pattern = '/INSERT INTO `(?P<table>[^`]+)` \((?P<columns>[^)]+)\) VALUES\s*(?P<values>[^;]+);/mi';
        preg_match_all($pattern, $sqlDump, $matches, PREG_SET_ORDER);
        $result = [];

        foreach ($matches as $match) {
            $table = $match['table'];
            $columns = array_map(fn ($column) => trim($column, " `"), explode(',', $match['columns']));
            $valuesBlock = trim($match['values']);
            $rows = preg_split('/\),\s*\(/', trim($valuesBlock, "() \n\r"));

            foreach ($rows as $row) {
                $parsedValues = $this->parseRowValues($row);

                if (count($columns) !== count($parsedValues)) {
                    continue;
                }

                $result[$table][] = array_combine($columns, $parsedValues);
            }
        }

        return $result;
    }

    private function parseRowValues(string $row): array
    {
        $values = str_getcsv($row, ',', "'", '\\');

        return array_map(function ($value) {
            if ($value === null) {
                return null;
            }

            $trimmed = trim($value);

            if ($trimmed === 'NULL') {
                return null;
            }

            if ($trimmed === '') {
                return '';
            }

            if (preg_match('/^-?\d+$/', $trimmed)) {
                return (int) $trimmed;
            }

            if (preg_match('/^-?\d+\.\d+$/', $trimmed)) {
                return (float) $trimmed;
            }

            return $trimmed;
        }, $values);
    }

    private function transformRow(string $table, array $row): array
    {
        foreach ($row as $key => $value) {
            if (Str::endsWith($key, '_id') && $value !== null) {
                $row[$key] = (string) $value;
                continue;
            }

            if ($value === null) {
                $row[$key] = null;
                continue;
            }

            if (is_string($value) && $this->looksLikeDateField($key)) {
                $row[$key] = $this->parseDateValue($value);
                continue;
            }

            if (is_string($value) && preg_match('/^-?\d+$/', $value)) {
                $row[$key] = (int) $value;
                continue;
            }

            if (is_string($value) && preg_match('/^-?\d+\.\d+$/', $value)) {
                $row[$key] = (float) $value;
            }
        }

        if (isset($row['id'])) {
            $row['id'] = (string) $row['id'];
        }

        if ($table === 'utilisateurs') {
            $row['mot_de_passe_hash'] = $row['mot_de_passe'] ?? null;
            unset($row['mot_de_passe']);
        }

        $timestampedTables = [
            'articles',
            'familles',
            'clients',
            'fournisseurs',
            'stock',
            'ventes',
            'archives',
            'historiques',
            'historique_prix_achat',
            'historique_prix_vente',
            'historique_quantite_standard',
        ];

        if (in_array($table, $timestampedTables, true) || $table === 'utilisateurs') {
            $row['created_at'] = $this->parseDateValue($row['date_creation'] ?? $row['created_at'] ?? null);
            $row['updated_at'] = $this->parseDateValue($row['date_modification'] ?? $row['updated_at'] ?? null);
            unset($row['date_creation'], $row['date_modification']);

            if (!array_key_exists('deleted_at', $row)) {
                $row['deleted_at'] = null;
            }
        }

        if (array_key_exists('date_modification', $row) && $row['date_modification'] === null) {
            unset($row['date_modification']);
        }

        if ($table === 'stock') {
            if (isset($row['date_fabrication'])) {
                $row['date_fabrication'] = $this->parseDateValue($row['date_fabrication']);
            }

            if (isset($row['date_peremption'])) {
                $row['date_peremption'] = $this->parseDateValue($row['date_peremption']);
            }
        }

        return $row;
    }

    private function parseDateValue(mixed $value): ?Carbon
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof Carbon) {
            return $value;
        }

        $stringValue = (string) $value;

        if ($stringValue === '' || $stringValue === '0000-00-00' || $stringValue === '0000-00-00 00:00:00') {
            return null;
        }

        try {
            return Carbon::parse($stringValue);
        } catch (Throwable) {
            return null;
        }
    }

    private function looksLikeDateField(string $field): bool
    {
        return Str::contains($field, 'date') || Str::endsWith($field, '_at');
    }

    private function truncateCollections(array $collections): void
    {
        $unique = array_values(array_unique($collections));

        foreach ($unique as $collection) {
            $snapshot = $this->firestore->collection($collection)->documents();

            foreach ($snapshot as $document) {
                $document->reference()->delete();
            }
        }
    }

    private function buildDryRunPreview(string $table, array $document): string
    {
        $fieldsMap = [
            'utilisateurs' => ['nom', 'role', 'email'],
            'stock' => ['article_id', 'fournisseur_id', 'lot', 'quantite', 'montant'],
            'ventes' => ['stock_id', 'client_id', 'quantite', 'montant'],
        ];

        $fields = $fieldsMap[$table] ?? array_values(array_diff(array_keys($document), ['id']));
        $fields = array_slice($fields, 0, 5);

        $parts = [];

        foreach ($fields as $field) {
            if (!array_key_exists($field, $document)) {
                continue;
            }

            $value = $document[$field];

            if ($value instanceof Carbon) {
                $value = $value->toDateTimeString();
            }

            if (is_array($value)) {
                $value = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            }

            $parts[] = sprintf('%s=%s', $field, (string) $value);
        }

        return implode(', ', $parts);
    }

    /**
     * Initialiser les collections dossiers et contenus pour Drive/Firestore
     */
    private function initializeDriveCollections(): void
    {
        $folders = config('drive.folders');
        
        if (empty($folders)) {
            $this->warn('Configuration des dossiers Drive non trouvée.');
            return;
        }

        $dossiersCollection = $this->firestore->collection('dossiers');
        $now = Carbon::now();

        foreach ($folders as $type => $folderConfig) {
            $data = [
                'nom' => $folderConfig['nom'],
                'type' => $type,
                'description' => $folderConfig['description'],
                'drive_folder_id' => $folderConfig['id'],
                'dateCreation' => $now,
                'dateModification' => $now,
            ];

            try {
                $this->firestore->createDocument('dossiers', $data, $type);
                $this->line("✓ Dossier '{$type}' créé dans Firestore");
            } catch (Throwable $e) {
                // Le document existe peut-être déjà
                $this->line("→ Dossier '{$type}' déjà existant ou erreur: {$e->getMessage()}");
            }
        }

        $this->info('Collections dossiers initialisées.');
    }
}
