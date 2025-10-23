<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\FirestoreService;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContenuController extends Controller
{
    protected FirestoreService $firestoreService;
    protected GoogleDriveService $driveService;

    public function __construct(FirestoreService $firestoreService, GoogleDriveService $driveService)
    {
        $this->firestoreService = $firestoreService;
        $this->driveService = $driveService;
    }

    /**
     * Lister tous les contenus depuis Firestore
     * GET /api/contenus
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Si un type est spécifié, filtrer par type
            if ($request->has('type')) {
                $contenus = $this->firestoreService->getContenus($request->type);
            } else {
                // Récupérer tous les contenus de tous les types
                $types = config('drive.types');
                $contenus = collect();
                
                foreach ($types as $type) {
                    $contenus = $contenus->merge($this->firestoreService->getContenus($type));
                }
            }

            return response()->json([
                'success' => true,
                'data' => $contenus,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des contenus',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer les contenus par type depuis Firestore
     * GET /api/contenus/type/{type}
     */
    public function getByType(string $type): JsonResponse
    {
        try {
            $contenus = $this->firestoreService->getContenus($type);

            return response()->json([
                'success' => true,
                'data' => $contenus,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des contenus',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Afficher un contenu spécifique depuis Firestore
     * GET /api/contenus/{id}
     */
    public function show(string $id): JsonResponse
    {
        try {
            $contenu = $this->firestoreService->getContenu($id);

            if (!$contenu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contenu non trouvé',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $contenu,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du contenu',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Uploader un nouveau contenu
     * POST /api/contenus/upload
     */
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:102400', // 100MB max
            'type' => 'required|in:images,videos,audio,documents',
            'access_token' => 'nullable|string', // Token OAuth2 Google
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $type = $request->type;
            $file = $request->file('file');
            $accessToken = $request->access_token;

            // Récupérer le dossier correspondant depuis Firestore
            $dossier = $this->firestoreService->getDossier($type);

            if (!$dossier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dossier non trouvé pour ce type',
                ], 404);
            }

            // Upload vers Google Drive
            $driveFile = $this->driveService->uploadFile(
                $file,
                $dossier['drive_folder_id'],
                $accessToken
            );

            // Sauvegarder dans Firestore
            $contenuData = [
                'nom' => $driveFile['name'],
                'type' => $type,
                'mime_type' => $driveFile['mimeType'],
                'drive_file_id' => $driveFile['id'],
                'web_view_link' => $driveFile['webViewLink'],
                'thumbnail_link' => $driveFile['thumbnailLink'] ?? null,
                'taille' => $driveFile['size'] ?? null,
                'dossier_type' => $type,
            ];

            $contenu = $this->firestoreService->sauvegarderContenu($contenuData);

            return response()->json([
                'success' => true,
                'message' => 'Fichier téléversé avec succès',
                'data' => $contenu,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléversement',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer un contenu depuis Firestore et Drive
     * DELETE /api/contenus/{id}
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        try {
            $contenu = $this->firestoreService->getContenu($id);

            if (!$contenu) {
                return response()->json([
                    'success' => false,
                    'message' => 'Contenu non trouvé',
                ], 404);
            }

            $accessToken = $request->access_token;

            // Supprimer de Google Drive
            $this->driveService->deleteFile($contenu['drive_file_id'], $accessToken);

            // Supprimer de Firestore
            $this->firestoreService->supprimerContenu($id);

            return response()->json([
                'success' => true,
                'message' => 'Contenu supprimé avec succès',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Synchroniser les contenus depuis Firestore et Drive
     * POST /api/contenus/sync/{type}
     */
    public function sync(string $type): JsonResponse
    {
        try {
            $dossier = $this->firestoreService->getDossier($type);

            if (!$dossier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Dossier non trouvé',
                ], 404);
            }

            // Récupérer les fichiers depuis Drive
            $driveFiles = $this->driveService->listFiles($dossier['drive_folder_id']);

            // Récupérer les contenus depuis Firestore
            $firestoreContenus = $this->firestoreService->getContenus($type);

            $syncedContenus = [];

            foreach ($driveFiles as $driveFile) {
                // Chercher dans Firestore
                $firestoreContenu = $firestoreContenus->firstWhere('drive_file_id', $driveFile['id']);

                if (!$firestoreContenu) {
                    // Créer dans Firestore si n'existe pas
                    $contenuData = [
                        'nom' => $driveFile['name'],
                        'type' => $type,
                        'mime_type' => $driveFile['mimeType'],
                        'drive_file_id' => $driveFile['id'],
                        'web_view_link' => $driveFile['webViewLink'],
                        'thumbnail_link' => $driveFile['thumbnailLink'] ?? null,
                        'dossier_type' => $type,
                    ];

                    $firestoreContenu = $this->firestoreService->sauvegarderContenu($contenuData);
                }

                $syncedContenus[] = $firestoreContenu;
            }

            return response()->json([
                'success' => true,
                'message' => 'Contenus synchronisés avec succès',
                'data' => $syncedContenus,
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
