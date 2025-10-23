<?php 
    namespace App\Services\Firebase;

use Google\Cloud\Storage\StorageClient;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class StorageService
{
    private $bucket;

    public function __construct()
    {
        $config = config('firebase');
        $client = new StorageClient([
            'projectId' => $config['project_id'],
            'keyFilePath' => $config['credentials'],
        ]);
        $this->bucket = $client->bucket($config['storage_bucket']);
    }

    public function uploadFile(UploadedFile $file, string $directory = 'uploads'): string
    {
        $path = trim($directory, '/') . '/' . Str::uuid() . '_' . $file->getClientOriginalName();
        $this->bucket->upload(fopen($file->getRealPath(), 'r'), ['name' => $path]);
        return $path;
    }

    public function download(string $path)
    {
        return $this->bucket->object($path)->downloadAsStream();
    }

    public function delete(string $path): void
    {
        $object = $this->bucket->object($path);
        if ($object->exists()) {
            $object->delete();
        }
    }
}
?>