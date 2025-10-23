<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class ConfigController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'googleClientId' => config('services.google.client_id'),
            'googleApiKey' => config('services.google.api_key'),
            'folders' => config('services.google.folders', []),
        ]);
    }
}
