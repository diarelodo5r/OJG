<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Article;

class Famille extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['nom_famille', 'description'];

    public function articles(){ return $this->hasMany(Article::class); }
}
