<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoriquePrixVente extends Model
{
    use HasFactory;

    protected $table = 'historique_prix_vente';

    protected $fillable = ['article_id','valeur'];

    protected $casts = [
        'valeur' => 'decimal:2',
    ];

    public function article(){ return $this->belongsTo(Article::class); }
}
