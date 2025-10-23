<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirestoreService;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DossierController extends Controller
{
    protected FirestoreService $firestoreService;
    protected ?GoogleDriveService $driveService;

    public function __construct(FirestoreService $firestoreService, ?GoogleDriveService $driveService = null)
    {
        $this->firestoreService = $firestoreService;
        $this->driveService = $driveService;
    }

    /**
     * Lister tous les dossiers depuis Firestore
     * GET /api/dossiers
     */
    public function index(): JsonResponse
    {
        try {
            $dossiers = $this->firestoreService->getDossiers();

            return response()->json([
                'success' => true,
                'data' => $dossiers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des dossiers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer un dossier spécifique par type depuis Firestore
     * GET /api/dossiers/{type}
     */
    public function show(string $type): JsonResponse
    {
        try {
            $dossier = $this->firestoreService->getDossier($type);

            if (!$dossier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dossier non trouvé',
                ], 404);
            }

            // Récupérer aussi les contenus de ce dossier
            $contenus = $this->firestoreService->getContenus($type);
            $dossier['contenus'] = $contenus;

            return response()->json([
                'success' => true,
                'data' => $dossier,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du dossier',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer les fichiers d'un dossier depuis Google Drive
     * GET /api/dossiers/{type}/files
     */
    public function getFiles(string $type): JsonResponse
    {
        try {
            if (!$this->driveService) {
                return response()->json([
                    'success' => false,
                    'message' => 'Google Drive service non disponible. Veuillez installer google/apiclient.',
                ], 503);
            }

            $dossier = $this->firestoreService->getDossier($type);

            if (!$dossier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dossier non trouvé',
                ], 404);
            }

            $files = $this->driveService->listFiles($dossier['drive_folder_id']);

            return response()->json([
                'success' => true,
                'data' => [
                    'dossier' => $dossier,
                    'files' => $files,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des fichiers',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Synchroniser les dossiers depuis Firestore
     * POST /api/dossiers/sync
     */
    public function sync(): JsonResponse
    {
        try {
            $dossiers = $this->firestoreService->getDossiers();

            return response()->json([
                'success' => true,
                'message' => 'Dossiers récupérés depuis Firestore',
                'data' => $dossiers,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la synchronisation',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
