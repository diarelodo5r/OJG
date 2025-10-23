<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Firebase Credentials
    |--------------------------------------------------------------------------
    |
    | This value points to the JSON credentials file for Firebase.
    | On Render or other cloud hosts, store this file securely (e.g. Secret File)
    | and expose its mount path to the application. Locally, you can keep the
    | file in the project root or anywhere else by setting FIREBASE_CREDENTIALS_PATH.
    |
    */

    'credentials' => [
        'file' => env(
            'FIREBASE_CREDENTIALS_PATH',
            env('FIREBASE_CREDENTIALS_JSON', '/etc/secrets/firebase_credentials.json') ?: base_path('firebase_credentials.json')
        ),
    ],

    /*
    |--------------------------------------------------------------------------
    | Other Firebase Config
    |--------------------------------------------------------------------------
    */

    'project_id' => env('FIREBASE_PROJECT_ID'),
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET'),
    'default_collection_prefix' => env('FIREBASE_COLLECTION_PREFIX', ''),

];