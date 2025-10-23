<?php

return [
    // Enable/disable teams (multi-tenancy). Keep false unless you need team support
    'teams' => false,

    // Table names used by the permission system
    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_permissions' => 'model_has_permissions',
        'model_has_roles' => 'model_has_roles',
        'role_has_permissions' => 'role_has_permissions',
        // Optional when teams=true
        'teams' => 'teams',
    ],

    // Column names configuration used by migrations
    'column_names' => [
        // When teams=true, this is used as the foreign key
        'team_foreign_key' => 'team_id',

        // Morph key name for your users table primary key
        // For Laravel 12 default users.id is big integer
        'model_morph_key' => 'model_id',

        // Pivot key names (referenced in your migration file)
        'role_pivot_key' => 'role_id',
        'permission_pivot_key' => 'permission_id',
    ],

    // Cache configuration (kept minimal); Spatie's package uses caching for performance
    'cache' => [
        'expiration_time' => \DateInterval::createFromDateString('24 hours'),
        'key' => 'spatie.permission.cache',
        'store' => null, // default cache store
    ],
];
