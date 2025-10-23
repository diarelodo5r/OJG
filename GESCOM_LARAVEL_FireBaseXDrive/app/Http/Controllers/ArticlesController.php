<?php
namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;

class ArticlesController extends Controller
{
    public function index(){ $articles = Article::latest()->paginate(25); return view('articles.index', compact('articles')); }
    public function create(){ return view('articles.create'); }
    public function store(Request $request){ /* TODO: add validation */ Article::create($request->all()); return redirect()->route('articles.index')->with('success','Article créé.'); }
    public function show(Article $article){ return view('articles.show', compact('article')); }
    public function edit(Article $article){ return view('articles.edit', compact('article')); }
    public function update(Request $request, Article $article){ $article->update($request->all()); return redirect()->route('articles.show',$article)->with('success','Article mis à jour.'); }
    public function destroy(Article $article){ $article->delete(); return redirect()->route('articles.index')->with('success','Article supprimé.'); }

    // API
    public function apiIndex(){ return response()->json(Article::latest()->paginate(50)); }
}
