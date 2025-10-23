<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Collection;
use Illuminate\Http\UploadedFile;

class GoogleDriveService
{
    protected GoogleDrive $driveService;
    protected string $apiKey;

    public function __construct()
    {
        $this->apiKey = config('services.google.api_key');
        $this->initializeDriveService();
    }

    /**
     * Initialiser le service Google Drive
     */
    protected function initializeDriveService(): void
    {
        $client = new GoogleClient();
        $client->setApplicationName('GESCOM OJG');
        $client->setDeveloperKey($this->apiKey);
        
        // Pour l'authentification OAuth2 (à configurer selon vos besoins)
        if (config('services.google.client_id')) {
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->setRedirectUri(config('services.google.redirect_uri'));
            $client->setScopes([GoogleDrive::DRIVE_FILE]);
        }

        $this->driveService = new GoogleDrive($client);
    }

    /**
     * Lister les fichiers d'un dossier Drive
     */
    public function listFiles(string $folderId, array $fields = ['id', 'name', 'mimeType', 'webViewLink', 'thumbnailLink']): Collection
    {
        $fieldsString = 'files(' . implode(',', $fields) . ')';
        
        $optParams = [
            'q' => "'{$folderId}' in parents and trashed=false",
            'fields' => $fieldsString,
            'orderBy' => 'name',
        ];

        $results = $this->driveService->files->listFiles($optParams);
        $files = [];

        foreach ($results->getFiles() as $file) {
            $fileData = [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'mimeType' => $file->getMimeType(),
                'webViewLink' => $file->getWebViewLink(),
                'thumbnailLink' => $file->getThumbnailLink(),
                'embedUrl' => "https://drive.google.com/file/d/{$file->getId()}/preview",
            ];
            
            $files[] = $fileData;
        }

        return collect($files);
    }

    /**
     * Uploader un fichier vers Google Drive
     */
    public function uploadFile(UploadedFile $file, string $folderId, ?string $accessToken = null): array
    {
        // Si un access token OAuth est fourni, l'utiliser
        if ($accessToken) {
            $client = $this->driveService->getClient();
            $client->setAccessToken($accessToken);
        }

        $fileMetadata = new DriveFile([
            'name' => $file->getClientOriginalName(),
            'parents' => [$folderId],
        ]);

        $content = file_get_contents($file->getRealPath());
        $mimeType = $file->getMimeType();

        $uploadedFile = $this->driveService->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id,name,mimeType,webViewLink,thumbnailLink,size',
        ]);

        return [
            'id' => $uploadedFile->getId(),
            'name' => $uploadedFile->getName(),
            'mimeType' => $uploadedFile->getMimeType(),
            'webViewLink' => $uploadedFile->getWebViewLink(),
            'thumbnailLink' => $uploadedFile->getThumbnailLink(),
            'size' => $uploadedFile->getSize(),
            'embedUrl' => "https://drive.google.com/file/d/{$uploadedFile->getId()}/preview",
        ];
    }

    /**
     * Supprimer un fichier de Google Drive
     */
    public function deleteFile(string $fileId, ?string $accessToken = null): bool
    {
        // Si un access token OAuth est fourni, l'utiliser
        if ($accessToken) {
            $client = $this->driveService->getClient();
            $client->setAccessToken($accessToken);
        }

        try {
            $this->driveService->files->delete($fileId);
            return true;
        } catch (\Exception $e) {
            \Log::error("Erreur lors de la suppression du fichier Drive: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtenir les informations d'un fichier
     */
    public function getFile(string $fileId): ?array
    {
        try {
            $file = $this->driveService->files->get($fileId, [
                'fields' => 'id,name,mimeType,webViewLink,thumbnailLink,size',
            ]);

            return [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'mimeType' => $file->getMimeType(),
                'webViewLink' => $file->getWebViewLink(),
                'thumbnailLink' => $file->getThumbnailLink(),
                'size' => $file->getSize(),
                'embedUrl' => "https://drive.google.com/file/d/{$file->getId()}/preview",
            ];
        } catch (\Exception $e) {
            \Log::error("Erreur lors de la récupération du fichier Drive: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Vérifier si un fichier existe
     */
    public function fileExists(string $fileId): bool
    {
        try {
            $this->driveService->files->get($fileId, ['fields' => 'id']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
