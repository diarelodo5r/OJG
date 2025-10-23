<?php

namespace App\Services\Firebase;

use Google\Cloud\Firestore\CollectionReference;
use Google\Cloud\Firestore\DocumentReference;
use Google\Cloud\Firestore\FirestoreClient;
use Google\Cloud\Firestore\Transaction;

class FirestoreService
{
    private FirestoreClient $client;
    private string $prefix;

    public function __construct()
    {
        $config = config('firebase');
        $this->client = new FirestoreClient([
            'projectId' => $config['project_id'],
            'keyFilePath' => $config['credentials'],
        ]);
        $this->prefix = $config['default_collection_prefix'] ?? '';
    }

    public function collection(string $name): CollectionReference
    {
        return $this->client->collection($this->prefix . $name);
    }

    public function document(string $collection, string $id): DocumentReference
    {
        return $this->collection($collection)->document($id);
    }

    public function newDocument(string $collection): DocumentReference
    {
        return $this->collection($collection)->newDocument();
    }

    public function createDocument(string $collection, array $data, ?string $id = null): DocumentReference
    {
        $reference = $id ? $this->document($collection, $id) : $this->newDocument($collection);
        $reference->set($data);
        return $reference;
    }

    public function getDocument(string $collection, string $id)
    {
        return $this->document($collection, $id)->snapshot();
    }

    public function query(string $collection): CollectionReference
    {
        return $this->collection($collection);
    }

    public function runTransaction(callable $callback)
    {
        return $this->client->runTransaction(static function (Transaction $transaction) use ($callback) {
            return $callback($transaction);
        });
    }

    public function client(): FirestoreClient
    {
        return $this->client;
    }
}