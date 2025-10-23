<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Article;
use App\Models\HistoriquePrixAchat;
use App\Models\Stock;

class Fournisseur extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'article_id','prixArticle','nom','telephone','adresse','description'
    ];

    protected $casts = [
        'prixArticle' => 'decimal:2',
    ];

    public function article(){ return $this->belongsTo(Article::class); }
    public function historiquesPrixAchat(){ return $this->hasMany(HistoriquePrixAchat::class); }
    public function stocks(){ return $this->hasMany(Stock::class); }
}
