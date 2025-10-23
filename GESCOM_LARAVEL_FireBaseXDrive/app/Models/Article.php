<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'famille_id',
        'nom_article',
        'image_article',
        'prixVente',
        'quantite_standard',
        'Conditionnement',
        'description',
    ];

    protected $casts = [
        'prixVente' => 'decimal:2',
    ];

    public function famille(){ return $this->belongsTo(Famille::class); }
    public function stocks(){ return $this->hasMany(Stock::class); }
    public function fournisseurs(){ return $this->hasMany(Fournisseur::class); }
    public function historiquesPrixVente(){ return $this->hasMany(HistoriquePrixVente::class); }
    public function historiquesQuantiteStandard(){ return $this->hasMany(HistoriqueQuantiteStandard::class); }
}
