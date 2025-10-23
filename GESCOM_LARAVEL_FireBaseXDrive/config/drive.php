<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuration des dossiers Google Drive
    |--------------------------------------------------------------------------
    |
    | Configuration des dossiers Google Drive pour chaque type de contenu
    |
    */

    'folders' => [
        'images' => [
            'id' => env('DRIVE_FOLDER_IMAGES'),
            'nom' => 'Images',
            'description' => 'Dossier contenant les images',
        ],
        'videos' => [
            'id' => env('DRIVE_FOLDER_VIDEOS'),
            'nom' => 'Vidéos',
            'description' => 'Dossier contenant les vidéos',
        ],
        'audio' => [
            'id' => env('DRIVE_FOLDER_AUDIO'),
            'nom' => 'Audio',
            'description' => 'Dossier contenant les fichiers audio',
        ],
        'documents' => [
            'id' => env('DRIVE_FOLDER_DOCUMENTS'),
            'nom' => 'Documents',
            'description' => 'Dossier contenant les documents',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Types de contenus
    |--------------------------------------------------------------------------
    */

    'types' => [
        'images' => 'images',
        'videos' => 'videos',
        'audio' => 'audio',
        'documents' => 'documents',
    ],

    /*
    |--------------------------------------------------------------------------
    | Collections Firestore
    |--------------------------------------------------------------------------
    */

    'collections' => [
        'dossiers' => 'dossiers',
        'contenus' => 'contenus',
    ],
];
