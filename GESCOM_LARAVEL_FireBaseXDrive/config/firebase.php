<?php

return [
    'project_id' => env('FIREBASE_PROJECT_ID'),
    'credentials' => env('FIREBASE_CREDENTIALS_PATH'),
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET'),
    'default_collection_prefix' => env('FIREBASE_COLLECTION_PREFIX', ''),
];

?>