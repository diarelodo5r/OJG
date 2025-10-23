<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoriqueQuantiteStandard extends Model
{
    use HasFactory;

    protected $table = 'historique_quantite_standard';

    protected $fillable = ['article_id','valeur'];

    public function article(){ return $this->belongsTo(Article::class); }
}
