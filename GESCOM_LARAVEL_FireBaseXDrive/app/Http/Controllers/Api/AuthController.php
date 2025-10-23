<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\UtilisateurRepositoryInterface;
use App\Services\Firebase\TokenStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly TokenStore $tokens, private readonly UtilisateurRepositoryInterface $utilisateurs)
    {
    }

    public function register(Request $request)
    {
        // Normalize legacy field names to French ones if needed
        if ($request->has('name') && !$request->has('nom')) {
            $request->merge(['nom' => $request->input('name')]);
        }
        if ($request->has('password') && !$request->has('mot_de_passe')) {
            $request->merge(['mot_de_passe' => $request->input('password')]);
        }

        $data = $request->validate([
            'nom' => ['required','string','max:255'],
            'email' => ['required','email','max:255'],
            'mot_de_passe' => ['required','string','min:8'],
        ], [
            'nom.required' => 'Le champ nom est obligatoire.',
            'email.required' => "Le champ email est obligatoire.",
            'email.email' => "L'email n'est pas valide.",
            'mot_de_passe.required' => 'Le mot de passe est obligatoire.',
            'mot_de_passe.min' => 'Le mot de passe doit contenir au moins :min caractères.',
        ]);

        if ($this->utilisateurs->findByNom($data['nom'])) {
            throw ValidationException::withMessages([
                'nom' => ['Ce nom est déjà utilisé.'],
            ]);
        }

        if ($this->utilisateurs->findByEmail($data['email'])) {
            throw ValidationException::withMessages([
                'email' => ["Cet email est déjà utilisé."],
            ]);
        }

        $user = $this->utilisateurs->create([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'mot_de_passe' => $data['mot_de_passe'],
        ]);

        $token = $this->issueToken($user, $request);

        return response()->json([
            'user' => $this->transformUser($user),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        // Normalize legacy field names (password and username)
        if ($request->has('password') && !$request->has('mot_de_passe')) {
            $request->merge(['mot_de_passe' => $request->input('password')]);
        }
        // Accept 'username' or 'nom' for login identifier (no email required)
        if ($request->has('username') && !$request->has('nom')) {
            $request->merge(['nom' => $request->input('username')]);
        }

        $credentials = $request->validate([
            'nom' => ['required','string'],
            'mot_de_passe' => ['required','string'],
        ], [
            'nom.required' => 'Le nom d\'utilisateur est obligatoire.',
            'mot_de_passe.required' => 'Le mot de passe est obligatoire.',
        ]);

        // Authenticate by username (nom)
        $user = $this->utilisateurs->findByNom($credentials['nom']);
        if (!$user || !($user['mot_de_passe_hash'] ?? false) || !Hash::check($credentials['mot_de_passe'], $user['mot_de_passe_hash'])) {
            throw ValidationException::withMessages([
                'nom' => ['Identifiants incorrects.'],
            ]);
        }

        $token = $this->issueToken($user, $request);

        return response()->json([
            'user' => $this->transformUser($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->attributes->get('auth_token');

        if ($token) {
            $this->tokens->deleteToken($token);
        }

        return response()->json(['message' => 'Logged out']);
    }

    private function issueToken(array $user, Request $request): string
    {
        $metadata = [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ];

        return $this->tokens->createToken($user['id'], metadata: $metadata);
    }

    private function transformUser(array $user): array
    {
        unset($user['mot_de_passe_hash']);

        return $user;
    }
}
