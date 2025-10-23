<?php

namespace App\Http\Middleware;

use App\Repositories\Contracts\UtilisateurRepositoryInterface;
use App\Services\Firebase\TokenStore;
use Closure;
use Illuminate\Auth\GenericUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class FirebaseTokenMiddleware
{
    public function __construct(
        private readonly TokenStore $tokens,
        private readonly UtilisateurRepositoryInterface $utilisateurs
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractBearerToken($request);
        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $record = $this->tokens->findToken($token);
        if (!$record || !$record['utilisateur_id']) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $userData = $this->utilisateurs->findById($record['utilisateur_id']);
        if (!$userData) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user = new GenericUser($userData);

        $this->tokens->touch($token);

        $request->attributes->set('auth_token', $token);
        $request->setUserResolver(static fn () => $user);
        Auth::setUser($user);

        return $next($request);
    }

    private function extractBearerToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        if (!str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return trim(mb_substr($header, 7));
    }
}
