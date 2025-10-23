<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ArticleRepositoryInterface;
use App\Services\Firebase\StorageService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArticleController extends Controller
{
    public function __construct(
        private readonly ArticleRepositoryInterface $articles,
        private readonly StorageService $storage
    ) {
    }

    public function index(Request $request)
    {
        $limit = min(max((int) $request->query('limit', 20), 1), 100);
        $startAfter = $request->query('startAfter');

        $page = $this->articles->paginate($limit, $startAfter);
        $items = array_map(fn (array $article) => $this->normalizeArticle($article), $page['data']);

        return response()->json([
            'data' => $items,
            'nextPageToken' => $page['nextPageToken'] ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'famille_id' => 'required|string',
            'nom_article' => 'required|string|max:255',
            'image_article' => 'nullable|string|max:255',
            'prixVente' => 'nullable|numeric',
            'quantite_standard' => 'nullable|integer|min:0',
            'Conditionnement' => 'nullable|string|max:30',
            'description' => 'nullable|string',
        ]);

        $article = $this->articles->create($data);

        return response()->json(
            $this->normalizeArticle($article),
            Response::HTTP_CREATED
        );
    }

    public function show(string $articleId)
    {
        $article = $this->articles->find($articleId);
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        return response()->json($this->normalizeArticle($article));
    }

    public function update(Request $request, string $articleId)
    {
        $data = $request->validate([
            'famille_id' => 'sometimes|string',
            'nom_article' => 'sometimes|string|max:255',
            'image_article' => 'nullable|string|max:255',
            'prixVente' => 'nullable|numeric',
            'quantite_standard' => 'nullable|integer|min:0',
            'Conditionnement' => 'nullable|string|max:30',
            'description' => 'nullable|string',
        ]);

        $article = $this->articles->update($articleId, $data);
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        return response()->json($this->normalizeArticle($article));
    }

    public function destroy(string $articleId)
    {
        $article = $this->articles->find($articleId);
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        $this->articles->delete($articleId);

        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    public function uploadTempFile(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp,bmp|max:5120',
        ]);

        $file = $request->file('image');
        $path = $this->storage->uploadFile($file, 'articles/temp');

        return response()->json([
            'message' => 'Fichier uploadé temporairement avec succès',
            'path' => $path,
            'filename' => $file->getClientOriginalName(),
        ]);
    }

    public function uploadPhoto(Request $request, string $articleId)
    {
        $request->validate([
            'path' => 'required|string|max:500',
        ]);

        $article = $this->articles->updatePhoto($articleId, $request->input('path'));
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        return response()->json([
            'message' => 'Chemin de la photo enregistré avec succès',
            'path' => $request->input('path'),
        ]);
    }

    public function getPhoto(string $articleId)
    {
        $article = $this->articles->find($articleId);
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        $path = $article['image_article'] ?? null;
        if (!$path) {
            return response()->json(['message' => 'Aucune photo trouvée pour cet article'], 404);
        }

        try {
            $stream = $this->storage->download($path);
        } catch (\Throwable) {
            return response()->json(['message' => 'Fichier photo introuvable'], 404);
        }

        return new StreamedResponse(static function () use ($stream) {
            while (!$stream->eof()) {
                echo $stream->read(64 * 1024);
            }
        });
    }

    public function deletePhoto(string $articleId)
    {
        $article = $this->articles->find($articleId);
        if ($article === null) {
            return response()->json(['message' => 'Article introuvable'], 404);
        }

        if (empty($article['image_article'])) {
            return response()->json(['message' => 'Aucune photo à supprimer'], 404);
        }

        $this->articles->updatePhoto($articleId, null);

        return response()->json([
            'message' => 'Chemin de la photo supprimé avec succès',
        ]);
    }

    private function normalizeArticle(array $article): array
    {
        $article['created_at'] = $this->formatTimestamp($article['created_at'] ?? null);
        $article['updated_at'] = $this->formatTimestamp($article['updated_at'] ?? null);

        return $article;
    }

    private function formatTimestamp(mixed $value): ?string
    {
        if ($value instanceof Carbon) {
            return $value->toISOString();
        }

        if (is_string($value)) {
            return Carbon::parse($value)->toISOString();
        }

        return $value?->toISOString();
    }
}