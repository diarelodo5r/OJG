<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\UtilisateurRepositoryInterface;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class UtilisateurController extends Controller
{
    public function __construct(private readonly UtilisateurRepositoryInterface $utilisateurs)
    {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 20), 1), 100);
        $startAfter = $request->query('startAfter');

        $page = $this->utilisateurs->paginate($limit, $startAfter);
        $items = array_map(fn (array $user) => $this->normalizeUtilisateur($user), $page['data']);

        return response()->json([
            'data' => $items,
            'nextPageToken' => $page['nextPageToken'] ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'mot_de_passe' => 'required|string|min:6',
            'role' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:120',
            'description' => 'nullable|string',
            'adresse' => 'nullable|string|max:255',
            'sexe' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:30',
            'photo' => 'nullable|string|max:255',
        ]);

        $user = $this->utilisateurs->create($data);

        return response()->json(
            $this->normalizeUtilisateur($user),
            Response::HTTP_CREATED
        );
    }

    public function show(string $id)
    {
        $user = $this->utilisateurs->findById($id);
        if ($user === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        return response()->json($this->normalizeUtilisateur($user));
    }

    public function update(Request $request, string $id)
    {
        $data = $request->validate([
            'nom' => 'sometimes|string|max:255',
            'mot_de_passe' => 'nullable|string|min:6',
            'role' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:120',
            'description' => 'nullable|string',
            'adresse' => 'nullable|string|max:255',
            'sexe' => 'nullable|string|max:20',
            'telephone' => 'nullable|string|max:30',
            'photo' => 'nullable|string|max:255',
        ]);

        if (array_key_exists('mot_de_passe', $data) && empty($data['mot_de_passe'])) {
            unset($data['mot_de_passe']);
        }

        $existing = $this->utilisateurs->findById($id);
        if ($existing === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $this->utilisateurs->update($id, $data);
        $updated = $this->utilisateurs->findById($id);

        return response()->json($this->normalizeUtilisateur($updated ?? $existing));
    }

    public function destroy(string $id)
    {
        $user = $this->utilisateurs->findById($id);
        if ($user === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $this->utilisateurs->softDelete($id);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Upload temporaire d'un fichier (étape 1)
     * Accepte un fichier via FormData et retourne le chemin absolu du fichier sauvegardé
     */
    public function uploadTempFile(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,bmp|max:5120', // Max 5MB
        ]);

        $file = $request->file('image');
        
        // Créer le répertoire s'il n'existe pas
        $uploadDir = storage_path('app/public/users_temp');
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Générer un nom de fichier unique
        $filename = 'user_temp_' . time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();
        
        // Sauvegarder le fichier avec le chemin absolu
        $absolutePath = $uploadDir . DIRECTORY_SEPARATOR . $filename;
        $file->move($uploadDir, $filename);
        
        return response()->json([
            'message' => 'Fichier uploadé temporairement avec succès',
            'path' => $absolutePath,
            'filename' => $filename,
        ], 200);
    }

    /**
     * Enregistrer le chemin d'une photo de profil
     */
    public function uploadPhoto(Request $request, string $id)
    {
        $request->validate([
            'path' => 'required|string|max:500', // Chemin du fichier
        ]);

        $user = $this->utilisateurs->findById($id);
        if ($user === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $imagePath = $request->input('path');
        
        // Vérifier que le fichier existe
        if (!file_exists($imagePath)) {
            return response()->json([
                'message' => 'Le fichier spécifié n\'existe pas sur le disque',
                'path' => $imagePath
            ], 404);
        }
        
        // Vérifier que c'est une image
        $extension = strtolower(pathinfo($imagePath, PATHINFO_EXTENSION));
        $validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
        
        if (!in_array($extension, $validExtensions)) {
            return response()->json([
                'message' => 'Le fichier doit être une image (jpg, png, gif, webp, bmp)',
                'extension' => $extension
            ], 422);
        }

        // Enregistrer le chemin complet en base de données
        $this->utilisateurs->update($id, ['photo' => $imagePath]);

        return response()->json([
            'message' => 'Chemin de la photo enregistré avec succès',
            'path' => $imagePath,
        ], 200);
    }

    /**
     * Récupérer une photo de profil
     */
    public function getPhoto(string $id)
    {
        $user = $this->utilisateurs->findById($id);
        if ($user === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        $photo = $user['photo'] ?? null;
        if (!$photo) {
            return response()->json(['message' => 'Aucune photo de profil trouvée'], 404);
        }
        
        if (!file_exists($photo)) {
            return response()->json(['message' => 'Fichier photo introuvable'], 404);
        }

        return response()->file($photo);
    }

    /**
     * Supprimer le chemin de la photo de profil
     */
    public function deletePhoto(string $id)
    {
        $user = $this->utilisateurs->findById($id);
        if ($user === null) {
            return response()->json(['message' => 'Utilisateur introuvable'], 404);
        }

        if (empty($user['photo'])) {
            return response()->json(['message' => 'Aucune photo à supprimer'], 404);
        }
        
        // Supprimer uniquement le chemin en DB, pas le fichier physique
        $this->utilisateurs->update($id, ['photo' => null]);

        return response()->json([
            'message' => 'Chemin de la photo supprimé avec succès'
        ]);
    }

    private function normalizeUtilisateur(array $utilisateur): array
    {
        unset($utilisateur['mot_de_passe_hash'], $utilisateur['mot_de_passe']);

        $utilisateur['created_at'] = $this->formatTimestamp($utilisateur['created_at'] ?? null);
        $utilisateur['updated_at'] = $this->formatTimestamp($utilisateur['updated_at'] ?? null);

        return $utilisateur;
    }

    private function formatTimestamp(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        if ($value instanceof \DateTimeInterface) {
            return Carbon::instance($value)->toISOString();
        }

        if (is_string($value)) {
            return Carbon::parse($value)->toISOString();
        }

        return $value;
    }
}
