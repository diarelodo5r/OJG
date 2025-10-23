<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ClientController extends Controller
{
    public function index()
    {
        return response()->json(Client::query()->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:60',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $client = Client::create($data);
        return response()->json($client, Response::HTTP_CREATED);
    }

    public function show(Client $client)
    {
        return response()->json($client);
    }

    public function update(Request $request, Client $client)
    {
        $data = $request->validate([
            'nom' => 'sometimes|required|string|max:60',
            'telephone' => 'nullable|string|max:30',
            'adresse' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);
        $client->update($data);
        return response()->json($client);
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
