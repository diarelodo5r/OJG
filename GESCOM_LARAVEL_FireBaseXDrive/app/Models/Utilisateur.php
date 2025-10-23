<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;

class Utilisateur extends Authenticatable
{
    use HasFactory, SoftDeletes, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom','mot_de_passe','role','email','description','adresse','sexe','telephone','photo'
    ];

    protected $hidden = ['mot_de_passe'];

    public function historiques(){ return $this->hasMany(Historique::class); }
    public function archives(){ return $this->hasMany(Archive::class); }

    /**
     * Return the password for authentication (mapped to mot_de_passe).
     */
    public function getAuthPassword()
    {
        return $this->mot_de_passe;
    }
}
