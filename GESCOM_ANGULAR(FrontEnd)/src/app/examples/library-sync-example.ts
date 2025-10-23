/**
 * Exemple d'utilisation de la synchronisation de la bibliothèque
 * 
 * Ce fichier montre comment utiliser les différentes méthodes de synchronisation
 * dans votre application Angular.
 */

import { LibraryService } from '../services/gescom/library.service';
import { GoogleAuthService } from '../services/gescom/google-auth.service';
import { MediaType } from '../interfaces/gescom/library.models';

export class LibrarySyncExample {
  constructor(
    private libraryService: LibraryService,
    private googleAuthService: GoogleAuthService
  ) {}

  /**
   * Exemple 2: Synchroniser tous les types de médias
   * À utiliser pour mettre à jour tous les contenus
   */
  async example2_SyncAllMedia(): Promise<void> {
    console.log('=== Exemple 2: Synchronisation complète ===');
    
    try {
      console.log('Synchronisation de tous les médias...');
      const result = await this.libraryService.syncAllContenus();
      
      console.log('✓ Synchronisation terminée:');
      for (const [type, contenus] of Object.entries(result)) {
        console.log(`  - ${type}: ${contenus.length} éléments`);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 3: Synchroniser un type spécifique
   * À utiliser pour mettre à jour un seul type de média
   */
  async example3_SyncSpecificType(): Promise<void> {
    console.log('=== Exemple 3: Synchronisation d\'un type spécifique ===');
    
    const type: MediaType = 'images';
    
    try {
      console.log(`Synchronisation de ${type}...`);
      const contenus = await this.libraryService.syncContenus(type);
      
      console.log(`✓ ${contenus.length} éléments synchronisés`);
      
      // Afficher quelques détails
      contenus.slice(0, 3).forEach(contenu => {
        console.log(`  - ${contenu.nom} (${contenu.mime_type})`);
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 4: Récupérer le statut de synchronisation
   * À utiliser pour vérifier l'état de la bibliothèque
   */
  async example4_GetSyncStatus(): Promise<void> {
    console.log('=== Exemple 4: Statut de synchronisation ===');
    
    try {
      const status = await this.libraryService.getSyncStatus();
      
      console.log('Statut de la bibliothèque:');
      console.log('  - Initialisée:', status.isInitialized);
      console.log('  - Nombre de dossiers:', status.dossierCount);
      console.log('  - Contenus par type:');
      console.log('    • Images:', status.contenuCount.images);
      console.log('    • Vidéos:', status.contenuCount.videos);
      console.log('    • Audio:', status.contenuCount.audio);
      console.log('    • Documents:', status.contenuCount.documents);
      
      const total = Object.values(status.contenuCount).reduce((sum, count) => sum + count, 0);
      console.log('  - Total:', total, 'éléments');
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 5: Récupérer et afficher les dossiers
   */
  async example5_GetDossiers(): Promise<void> {
    console.log('=== Exemple 5: Récupération des dossiers ===');
    
    try {
      const dossiers = await this.libraryService.getDossiers();
      
      console.log(`${dossiers.length} dossiers trouvés:`);
      dossiers.forEach(dossier => {
        console.log(`  - ${dossier.nom} (${dossier.type})`);
        console.log(`    ID Drive: ${dossier.drive_folder_id}`);
        if (dossier.contenus) {
          console.log(`    Contenus: ${dossier.contenus.length}`);
        }
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 6: Récupérer les contenus d'un type spécifique
   */
  async example6_GetContenusByType(): Promise<void> {
    console.log('=== Exemple 6: Contenus par type ===');
    
    const type: MediaType = 'images';
    
    try {
      const contenus = await this.libraryService.getContenusByType(type);
      
      console.log(`${contenus.length} ${type} trouvées:`);
      contenus.slice(0, 5).forEach(contenu => {
        console.log(`  - ${contenu.nom}`);
        console.log(`    Type MIME: ${contenu.mime_type}`);
        const tailleValue = contenu.taille !== undefined ? Number(contenu.taille) : undefined;
        const tailleText = tailleValue !== undefined && !Number.isNaN(tailleValue)
          ? `${(tailleValue / 1024).toFixed(2)} KB`
          : '0.00 KB';
        console.log(`    Taille: ${tailleText}`);
        console.log(`    Lien: ${contenu.web_view_link}`);
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 7: Convertir les contenus en MediaItems
   */
  async example7_ConvertToMediaItems(): Promise<void> {
    console.log('=== Exemple 7: Conversion en MediaItems ===');
    
    try {
      const mediaItems = await this.libraryService.getMediaItems('images');
      
      console.log(`${mediaItems.length} MediaItems créés:`);
      mediaItems.slice(0, 3).forEach(item => {
        console.log(`  - ${item.title}`);
        console.log(`    Type: ${item.type}`);
        console.log(`    Taille: ${item.size}`);
        console.log(`    Date: ${item.uploadedAt.toLocaleDateString('fr-FR')}`);
        console.log(`    Extension: ${item.extension}`);
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 8: Upload d'un fichier via l'API
   */
  async example8_UploadFile(file: File, type: MediaType): Promise<void> {
    console.log('=== Exemple 8: Upload de fichier ===');
    
    try {
      console.log(`Upload de ${file.name} (${type})...`);
      
      const contenu = await this.libraryService.uploadFileViaApi({
        file,
        type,
      });
      
      console.log('✓ Fichier uploadé avec succès:');
      console.log(`  - ID: ${contenu.id}`);
      console.log(`  - Nom: ${contenu.nom}`);
      console.log(`  - Type: ${contenu.type}`);
      console.log(`  - Drive ID: ${contenu.drive_file_id}`);
      console.log(`  - Lien: ${contenu.web_view_link}`);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 9: Supprimer un contenu
   */
  async example9_DeleteContenu(id: string): Promise<void> {
    console.log('=== Exemple 9: Suppression de contenu ===');
    
    try {
      console.log(`Suppression du contenu ${id}...`);
      await this.libraryService.deleteContenu(id);
      console.log('✓ Contenu supprimé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
    }
  }

  /**
   * Exemple 10: Workflow complet
   * Initialisation → Synchronisation → Affichage
   */
  async example10_CompleteWorkflow(): Promise<void> {
    console.log('=== Exemple 10: Workflow complet ===');
    
    try {
      // 1. Connexion Google
      console.log('1. Connexion à Google...');
      await this.googleAuthService.ensureSignedIn();
      console.log('✓ Connecté');
      
      // 2. Vérification de l'initialisation
      console.log('\n2. Vérification de l\'initialisation...');
      const isInitialized = await this.libraryService.isLibraryInitialized();
      
      if (!isInitialized) {
        console.log('   Bibliothèque non initialisée');
        console.log('\n3. Initialisation...');
        const result = await this.libraryService.initializeLibrary();
        console.log(`✓ ${result.dossiers.length} dossiers créés`);
      } else {
        console.log('✓ Bibliothèque déjà initialisée');
        
        // 3. Synchronisation
        console.log('\n3. Synchronisation...');
        await this.libraryService.syncAllContenus();
        console.log('✓ Synchronisation terminée');
      }
      
      // 4. Récupération du statut
      console.log('\n4. Statut final:');
      const status = await this.libraryService.getSyncStatus();
      console.log(`   - Dossiers: ${status.dossierCount}`);
      console.log(`   - Images: ${status.contenuCount.images}`);
      console.log(`   - Vidéos: ${status.contenuCount.videos}`);
      console.log(`   - Audio: ${status.contenuCount.audio}`);
      console.log(`   - Documents: ${status.contenuCount.documents}`);
      
      // 5. Récupération des médias
      console.log('\n5. Récupération des médias...');
      const mediaItems = await this.libraryService.getMediaItems();
      console.log(`✓ ${mediaItems.length} médias disponibles`);
      
      console.log('\n✓ Workflow terminé avec succès');
    } catch (error) {
      console.error('Erreur dans le workflow:', error);
    }
  }

  /**
   * Exécuter tous les exemples
   */
  async runAllExamples(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  EXEMPLES DE SYNCHRONISATION DE LA BIBLIOTHÈQUE       ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    await this.example2_SyncAllMedia();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await this.example3_SyncSpecificType();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await this.example4_GetSyncStatus();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await this.example5_GetDossiers();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await this.example6_GetContenusByType();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    await this.example7_ConvertToMediaItems();
    console.log('\n' + '─'.repeat(60) + '\n');
    
    console.log('✓ Tous les exemples ont été exécutés');
  }
}

/**
 * Utilisation dans la console du navigateur:
 * 
 * const component = ng.getComponent(document.querySelector('app-library'));
 * const example = new LibrarySyncExample(
 *   component.libraryService,
 *   component.googleAuthService
 * );
 * 
 * // Exécuter un exemple spécifique
 * await example.example1_InitializeLibrary();
 * 
 * // Ou tous les exemples
 * await example.runAllExamples();
 */
