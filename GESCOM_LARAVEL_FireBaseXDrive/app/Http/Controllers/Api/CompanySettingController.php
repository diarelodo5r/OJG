<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanySettingResource;
use App\Models\CompanySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CompanySettingController extends Controller
{
    /**
     * Récupère les paramètres de l'entreprise (généralement un seul enregistrement)
     */
    public function index(): JsonResponse
    {
        try {
            // On suppose qu'il n'y a qu'un seul enregistrement de paramètres
            $settings = CompanySetting::first();
            
            if (!$settings) {
                return response()->json([
                    'message' => 'Aucun paramètre entreprise trouvé',
                    'data' => null
                ], 404);
            }

            return response()->json([
                'message' => 'Paramètres entreprise récupérés avec succès',
                'data' => new CompanySettingResource($settings)
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des paramètres entreprise', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la récupération des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée ou met à jour les paramètres de l'entreprise
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string',
        ], [
            'name.required' => 'Le nom de l\'entreprise est obligatoire',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.email' => 'L\'email doit être valide',
            'website.url' => 'Le site web doit être une URL valide',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Chercher s'il existe déjà des paramètres
            $settings = CompanySetting::first();

            if ($settings) {
                // Mise à jour
                $settings->update($request->all());
                $message = 'Paramètres entreprise mis à jour avec succès';
            } else {
                // Création
                $settings = CompanySetting::create($request->all());
                $message = 'Paramètres entreprise créés avec succès';
            }

            DB::commit();

            return response()->json([
                'message' => $message,
                'data' => new CompanySettingResource($settings)
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la sauvegarde des paramètres entreprise', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la sauvegarde des paramètres',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche un paramètre spécifique
     */
    public function show(string $id): JsonResponse
    {
        try {
            $settings = CompanySetting::findOrFail($id);

            return response()->json([
                'message' => 'Paramètre récupéré avec succès',
                'data' => new CompanySettingResource($settings)
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Paramètre non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Met à jour un paramètre spécifique
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:150',
            'website' => 'nullable|url|max:255',
            'logo' => 'nullable|string',
        ], [
            'name.required' => 'Le nom de l\'entreprise est obligatoire',
            'name.max' => 'Le nom ne doit pas dépasser 255 caractères',
            'email.email' => 'L\'email doit être valide',
            'website.url' => 'Le site web doit être une URL valide',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        DB::beginTransaction();
        try {
            $settings = CompanySetting::findOrFail($id);
            $settings->update($request->all());

            DB::commit();

            return response()->json([
                'message' => 'Paramètres mis à jour avec succès',
                'data' => new CompanySettingResource($settings)
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la mise à jour des paramètres', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprime un paramètre spécifique
     */
    public function destroy(string $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $settings = CompanySetting::findOrFail($id);
            $settings->delete();

            DB::commit();

            return response()->json([
                'message' => 'Paramètre supprimé avec succès'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la suppression du paramètre', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Réinitialise les paramètres aux valeurs par défaut
     */
    public function reset(): JsonResponse
    {
        DB::beginTransaction();
        try {
            $settings = CompanySetting::first();

            if ($settings) {
                $settings->delete();
            }

            DB::commit();

            return response()->json([
                'message' => 'Paramètres réinitialisés avec succès'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur lors de la réinitialisation des paramètres', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Erreur lors de la réinitialisation',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
