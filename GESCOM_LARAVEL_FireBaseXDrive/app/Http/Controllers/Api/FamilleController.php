<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Famille;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class FamilleController extends Controller
{
    public function index()
    {
        return response()->json(Famille::query()->latest()->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom_famille' => 'required|string|max:255|unique:familles,nom_famille',
            'description' => 'nullable|string',
        ]);
        $famille = Famille::create($data);
        return response()->json($famille, Response::HTTP_CREATED);
    }

    public function show(Famille $famille)
    {
        return response()->json($famille);
    }

    public function update(Request $request, Famille $famille)
    {
        $data = $request->validate([
            'nom_famille' => 'sometimes|required|string|max:255|unique:familles,nom_famille,' . $famille->id,
            'description' => 'nullable|string',
        ]);
        $famille->update($data);
        return response()->json($famille);
    }

    public function destroy(Famille $famille)
    {
        $famille->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
