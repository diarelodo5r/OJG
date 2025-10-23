<?php
namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientsController extends Controller
{
    public function index(){ $clients = Client::latest()->paginate(25); return view('clients.index', compact('clients')); }
    public function create(){ return view('clients.create'); }
    public function store(Request $request){ Client::create($request->all()); return redirect()->route('clients.index'); }
    public function show(Client $client){ return view('clients.show', compact('client')); }
    public function edit(Client $client){ return view('clients.edit', compact('client')); }
    public function update(Request $request, Client $client){ $client->update($request->all()); return redirect()->route('clients.show',$client); }
    public function destroy(Client $client){ $client->delete(); return redirect()->route('clients.index'); }

    // API
    public function apiIndex(){ return response()->json(Client::latest()->paginate(50)); }
}
