import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettingsService } from './company-settings.service';
import { CompanySettings } from '../interfaces/company-settings.model';

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any, row: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private companySettingsService: CompanySettingsService) { }

  /**
   * Extrait la valeur d'une cellule en suivant un chemin imbriqué (ex: 'article.nom_article')
   */
  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return obj;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Nettoie les balises HTML d'une chaîne
   */
  private stripHtml(html: string): string {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  /**
   * Formate une valeur pour l'export
   */
  private formatValue(value: any, column: ExportColumn, row: any): string {
    if (column.format) {
      return column.format(value, row);
    }
    
    if (value === null || value === undefined) return '';
    
    // Nettoyer le HTML si présent
    const strValue = String(value);
    if (strValue.includes('<') && strValue.includes('>')) {
      return this.stripHtml(strValue);
    }
    
    return strValue;
  }

  /**
   * Prépare les données pour l'export
   */
  private prepareData(options: ExportOptions): any[][] {
    const headers = options.columns.map(col => col.label);
    const rows = options.data.map(row => {
      return options.columns.map(col => {
        const value = this.getNestedValue(row, col.key);
        return this.formatValue(value, col, row);
      });
    });
    return [headers, ...rows];
  }

  /**
   * Exporte en Excel
   */
  exportToExcel(options: ExportOptions): void {
    if (!options.data || options.data.length === 0) {
      alert('Aucune donnée à exporter !');
      return;
    }

    const data = this.prepareData(options);
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Style pour les en-têtes
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E6E6E6' } }
      };
    }

    // Auto-ajustement des colonnes
    const colWidths = options.columns.map((col, i) => {
      const maxLength = Math.max(
        col.label.length,
        ...options.data.map(row => {
          const value = this.getNestedValue(row, col.key);
          return String(this.formatValue(value, col, row)).length;
        })
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Données');
    
    const filename = `${options.filename}_${this.getDateString()}.xlsx`;
    XLSX.writeFile(wb, filename);
  }

  /**
   * Exporte en CSV
   */
  exportToCSV(options: ExportOptions): void {
    if (!options.data || options.data.length === 0) {
      alert('Aucune donnée à exporter !');
      return;
    }

    const data = this.prepareData(options);
    
    // Convertir en CSV avec point-virgule comme séparateur
    const csvContent = data.map(row => 
      row.map(cell => {
        // Échapper les guillemets et entourer de guillemets si nécessaire
        const cellStr = String(cell);
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')
    ).join('\n');

    // Ajouter BOM UTF-8 pour Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const filename = `${options.filename}_${this.getDateString()}.csv`;
    this.downloadBlob(blob, filename);
  }

  /**
   * Exporte en PDF avec logo et informations de l'entreprise
   */
  exportToPDF(options: ExportOptions): void {
    if (!options.data || options.data.length === 0) {
      alert('Aucune donnée à exporter !');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const companySettings = this.companySettingsService.getSettings();
    
    let currentY = 10;
    
    // Ajouter le logo et les informations de l'entreprise
    currentY = this.addCompanyHeader(doc, companySettings, currentY);
    
    // Titre du document
    if (options.title) {
      const titleLines = options.title.split('\n').filter(line => line.trim());
      
      titleLines.forEach((line, index) => {
        if (index === 0) {
          // Première ligne en gras et plus grande (titre principal)
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(line, 14, currentY);
          currentY += 8;
        } else {
          // Autres lignes en taille normale
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(line, 14, currentY);
          currentY += 6;
        }
      });
      
      currentY += 5; // Espacement supplémentaire avant le tableau
    }

    const data = this.prepareData(options);
    const headers = [data[0]];
    const rows = data.slice(1);

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: currentY,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { top: 15, right: 14, bottom: 20, left: 14 },
      theme: 'grid',
      tableWidth: 'auto',
      columnStyles: this.getColumnStyles(options.columns.length),
      didDrawPage: (data) => {
        // Ajouter un pied de page avec la date et numéro de page
        const pageCount = (doc as any).internal.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        
        const footerText = `Page ${data.pageNumber} / ${pageCount}`;
        const textWidth = doc.getTextWidth(footerText);
        const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
        
        doc.text(footerText, pageWidth - textWidth - 14, pageHeight - 10);
        
        const dateText = `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
        doc.text(dateText, 14, pageHeight - 10);
      }
    });

    const filename = `${options.filename}_${this.getDateString()}.pdf`;
    doc.save(filename);
  }

  /**
   * Génère les styles de colonnes pour le PDF
   */
  private getColumnStyles(columnCount: number): any {
    const styles: any = {};
    const baseWidth = 250 / columnCount; // Largeur disponible divisée par nombre de colonnes
    
    for (let i = 0; i < columnCount; i++) {
      styles[i] = {
        cellWidth: Math.max(baseWidth, 15), // Minimum 15mm
        overflow: 'linebreak'
      };
    }
    
    return styles;
  }

  /**
   * Télécharge un blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  }

  /**
   * Retourne la date actuelle au format YYYYMMDD
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Ajoute l'en-tête avec logo et informations de l'entreprise au PDF
   */
  private addCompanyHeader(doc: jsPDF, settings: CompanySettings, startY: number): number {
    let currentY = startY;
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Ajouter le logo si disponible (centré)
    if (settings.logo) {
      try {
        const logoWidth = 30;
        const logoHeight = 30;
        const logoX = centerX - (logoWidth / 2);
        doc.addImage(settings.logo, 'PNG', logoX, currentY, logoWidth, logoHeight);
        currentY += logoHeight + 5;
      } catch (error) {
        console.error('Erreur lors de l\'ajout du logo:', error);
      }
    }

    // Nom de l'entreprise (centré, gras)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.name, centerX, currentY, { align: 'center' });
    currentY += 6;

    // Description (centrée)
    if (settings.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(settings.description, centerX, currentY, { align: 'center' });
      currentY += 5;
    }

    // Informations de contact (centrées)
    doc.setFontSize(8);
    const contactInfo: string[] = [];
    if (settings.address) contactInfo.push(settings.address);
    if (settings.phone) contactInfo.push(`Tél: ${settings.phone}`);
    if (settings.email) contactInfo.push(`Email: ${settings.email}`);
    if (settings.website) contactInfo.push(settings.website);

    if (contactInfo.length > 0) {
      const contactText = contactInfo.join(' | ');
      doc.text(contactText, centerX, currentY, { align: 'center' });
      currentY += 5;
    }

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 8;

    return currentY;
  }
}
