
// Ce fichier contient la page d'analyse de fichiers Excel
// Fonctionnalités:
// - Téléchargement de fichiers Excel
// - Analyse des données du fichier
// - Affichage et édition des données
// - Amélioré pour capturer tous les détails des fichiers Excel

import React, { useState, useEffect } from "react";
import { read, utils, WorkBook, WorkSheet } from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Info, 
  FileSpreadsheet, 
  Save, 
  Upload, 
  ArrowLeft, 
  FileDown, 
  BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Type pour une ligne de données Excel
type ExcelRow = Record<string, string | number | boolean | null>;

// Type pour les informations sur une feuille Excel
type SheetInfo = {
  name: string;
  data: ExcelRow[];
  columns: string[];
};

const ExcelAnalyzer = () => {
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [editableData, setEditableData] = useState<ExcelRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [allSheets, setAllSheets] = useState<SheetInfo[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [summary, setSummary] = useState<{
    totalRows: number;
    numericColumns: string[];
    textColumns: string[];
    booleanColumns: string[];
    blankCells: number;
    averages: Record<string, number>;
    fileSize: string;
    dateModified: string;
    sheets: { name: string; rows: number }[];
  }>({
    totalRows: 0,
    numericColumns: [],
    textColumns: [],
    booleanColumns: [],
    blankCells: 0,
    averages: {},
    fileSize: "",
    dateModified: "",
    sheets: [],
  });

  // Gestionnaire de téléchargement de fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);
    setIsLoading(true);

    // Informations sur le fichier
    const fileSize = formatFileSize(file.size);
    const dateModified = new Date(file.lastModified).toLocaleString();

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const wb = read(data, { 
          type: "binary", 
          cellDates: true,
          cellNF: true,
          cellText: true
        });
        
        setWorkbook(wb);
        
        // Traiter toutes les feuilles
        const sheetsInfo: SheetInfo[] = [];
        const sheetsForSummary: { name: string; rows: number }[] = [];
        
        wb.SheetNames.forEach((sheetName) => {
          const sheet = wb.Sheets[sheetName];
          const jsonData = utils.sheet_to_json<ExcelRow>(sheet, {
            defval: null, // Utiliser null comme valeur par défaut pour les cellules vides
            raw: false // Convertir en types appropriés
          });
          
          const sheetColumns = jsonData.length > 0 
            ? Object.keys(jsonData[0]) 
            : [];
            
          sheetsInfo.push({
            name: sheetName,
            data: jsonData,
            columns: sheetColumns
          });
          
          sheetsForSummary.push({
            name: sheetName,
            rows: jsonData.length
          });
        });
        
        setAllSheets(sheetsInfo);
        
        if (sheetsInfo.length > 0) {
          // Définir la première feuille comme active par défaut
          const firstSheet = sheetsInfo[0];
          setActiveSheet(firstSheet.name);
          setExcelData(firstSheet.data);
          setEditableData(JSON.parse(JSON.stringify(firstSheet.data)));
          setColumns(firstSheet.columns);
          
          // Analyser les données de la première feuille
          analyzeData(firstSheet.data, firstSheet.columns, {
            fileSize,
            dateModified,
            sheets: sheetsForSummary
          });
        } else {
          setError("Le fichier Excel ne contient pas de données.");
        }
      } catch (err) {
        console.error("Erreur de lecture du fichier Excel:", err);
        setError("Erreur lors de la lecture du fichier Excel. Vérifiez le format du fichier.");
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
      setIsLoading(false);
    };

    reader.readAsBinaryString(file);
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Changement de feuille active
  const handleSheetChange = (sheetName: string) => {
    const sheet = allSheets.find(s => s.name === sheetName);
    if (sheet) {
      setActiveSheet(sheetName);
      setExcelData(sheet.data);
      setEditableData(JSON.parse(JSON.stringify(sheet.data)));
      setColumns(sheet.columns);
      
      // Mettre à jour l'analyse avec les données de la nouvelle feuille
      analyzeData(sheet.data, sheet.columns, {
        fileSize: summary.fileSize,
        dateModified: summary.dateModified,
        sheets: summary.sheets
      });
    }
  };

  // Analyse des données pour le résumé
  const analyzeData = (
    data: ExcelRow[], 
    cols: string[], 
    fileInfo: { 
      fileSize: string, 
      dateModified: string,
      sheets: { name: string; rows: number }[]
    }
  ) => {
    const numericCols: string[] = [];
    const textCols: string[] = [];
    const booleanCols: string[] = [];
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let blankCells = 0;

    // Détecter les types de colonnes et calculer les sommes
    data.forEach((row) => {
      cols.forEach((col) => {
        const value = row[col];
        
        if (value === null || value === undefined || value === "") {
          blankCells++;
        } else if (typeof value === 'number') {
          if (!numericCols.includes(col)) {
            numericCols.push(col);
          }
          
          if (!sums[col]) sums[col] = 0;
          if (!counts[col]) counts[col] = 0;
          
          sums[col] += value;
          counts[col]++;
        } else if (typeof value === 'boolean') {
          if (!booleanCols.includes(col)) {
            booleanCols.push(col);
          }
        } else if (typeof value === 'string' && !textCols.includes(col)) {
          textCols.push(col);
        }
      });
    });

    // Calculer les moyennes
    const averages: Record<string, number> = {};
    numericCols.forEach((col) => {
      averages[col] = counts[col] > 0 ? sums[col] / counts[col] : 0;
    });

    setSummary({
      totalRows: data.length,
      numericColumns: numericCols,
      textColumns: textCols,
      booleanColumns: booleanCols,
      blankCells: blankCells,
      averages,
      fileSize: fileInfo.fileSize,
      dateModified: fileInfo.dateModified,
      sheets: fileInfo.sheets
    });
  };

  // Formatage des cellules (dates, nombres, booléens)
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    if (typeof value === 'boolean') {
      return value ? "Vrai" : "Faux";
    }
    
    return String(value);
  };

  // Gestion des modifications de cellule
  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...editableData];
    
    // Essayer de convertir en nombre si la colonne est numérique
    if (summary.numericColumns.includes(column)) {
      const numValue = parseFloat(value);
      newData[rowIndex][column] = isNaN(numValue) ? value : numValue;
    } 
    // Essayer de convertir en booléen si la colonne est booléenne
    else if (summary.booleanColumns.includes(column)) {
      if (value.toLowerCase() === "true" || value.toLowerCase() === "vrai") {
        newData[rowIndex][column] = true;
      } else if (value.toLowerCase() === "false" || value.toLowerCase() === "faux") {
        newData[rowIndex][column] = false;
      } else {
        newData[rowIndex][column] = value;
      }
    } else {
      newData[rowIndex][column] = value;
    }
    
    setEditableData(newData);
  };

  // Sauvegarder les modifications
  const saveChanges = () => {
    // Mettre à jour la feuille active
    const updatedSheets = allSheets.map(sheet => {
      if (sheet.name === activeSheet) {
        return {
          ...sheet,
          data: editableData
        };
      }
      return sheet;
    });
    
    setAllSheets(updatedSheets);
    setExcelData(editableData);
    setIsEditing(false);
    
    // Mettre à jour l'analyse avec les nouvelles données
    analyzeData(editableData, columns, {
      fileSize: summary.fileSize,
      dateModified: summary.dateModified,
      sheets: summary.sheets
    });
    
    toast.success("Modifications enregistrées avec succès");
  };

  // Exporter les données modifiées
  const exportData = () => {
    try {
      if (!workbook) {
        setError("Aucun fichier à exporter.");
        return;
      }
      
      // Créer une copie du classeur
      const wb = workbook;
      
      // Mettre à jour toutes les feuilles avec les données modifiées
      allSheets.forEach(sheet => {
        // Convertir les données en feuille
        const ws = utils.json_to_sheet(sheet.data);
        // Remplacer la feuille existante
        wb.Sheets[sheet.name] = ws;
      });
      
      // Déclencher le téléchargement
      const exportFileName = fileName.replace(/\.[^/.]+$/, "") + "_modified.xlsx";
      utils.writeFile(wb, exportFileName);
      
      toast.success("Fichier exporté avec succès");
    } catch (err) {
      console.error("Erreur d'exportation:", err);
      setError("Erreur lors de l'exportation des données.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* En-tête */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Analyseur de fichiers Excel</h1>
          <Button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Button>
        </div>
      </div>

      {/* Téléchargement de fichier */}
      <div className="max-w-7xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-blue-500" />
              Importer un fichier Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="max-w-md"
              />
              {fileName && (
                <p className="text-sm text-gray-500">
                  Fichier actuel : <span className="font-medium">{fileName}</span>
                </p>
              )}
            </div>

            {error && (
              <Alert className="mt-4 bg-red-50 border-red-200">
                <Info className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Erreur</AlertTitle>
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* État de chargement */}
      {isLoading && (
        <div className="max-w-7xl mx-auto mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Affichage et édition des données */}
      {!isLoading && excelData.length > 0 && (
        <div className="max-w-7xl mx-auto">
          {/* Navigation entre les feuilles */}
          {allSheets.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {allSheets.map((sheet) => (
                <Button
                  key={sheet.name}
                  onClick={() => handleSheetChange(sheet.name)}
                  variant={activeSheet === sheet.name ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  {sheet.name}
                  <Badge variant="outline" className="ml-1">
                    {sheet.data.length} lignes
                  </Badge>
                </Button>
              ))}
            </div>
          )}
          
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data">Données</TabsTrigger>
              <TabsTrigger value="summary">Résumé</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {activeSheet && allSheets.length > 1 
                        ? `Feuille: ${activeSheet} (${excelData.length} lignes)` 
                        : `Données du fichier (${excelData.length} lignes)`}
                    </CardTitle>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button onClick={saveChanges} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                            <Save className="h-4 w-4" />
                            Enregistrer
                          </Button>
                          <Button onClick={() => {
                            setEditableData(JSON.parse(JSON.stringify(excelData)));
                            setIsEditing(false);
                          }} variant="outline">
                            Annuler
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                            Modifier
                          </Button>
                          <Button onClick={exportData} className="flex items-center gap-2">
                            <FileDown className="h-4 w-4" />
                            Exporter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {columns.map((column) => (
                            <TableHead key={column}>
                              {column}
                              {summary.numericColumns.includes(column) && (
                                <Badge variant="outline" className="ml-1 bg-blue-50">Nombre</Badge>
                              )}
                              {summary.booleanColumns.includes(column) && (
                                <Badge variant="outline" className="ml-1 bg-green-50">Bool</Badge>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {editableData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {columns.map((column) => (
                              <TableCell key={`${rowIndex}-${column}`}>
                                {isEditing ? (
                                  <Input
                                    value={row[column] !== null ? row[column]?.toString() : ""}
                                    onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                                    className="min-w-[100px]"
                                  />
                                ) : (
                                  formatCellValue(row[column])
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé des données</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Informations sur le fichier</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Nom du fichier:</span>
                          <span className="font-medium">{fileName}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Taille:</span>
                          <span className="font-medium">{summary.fileSize}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Date de modification:</span>
                          <span className="font-medium">{summary.dateModified}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Nombre de feuilles:</span>
                          <span className="font-medium">{summary.sheets.length}</span>
                        </li>
                      </ul>
                      
                      {summary.sheets.length > 1 && (
                        <div className="mt-4">
                          <h4 className="text-md font-semibold mb-2">Feuilles</h4>
                          <ul className="space-y-1">
                            {summary.sheets.map(sheet => (
                              <li key={sheet.name} className="flex justify-between">
                                <span className="text-gray-600">{sheet.name}:</span>
                                <span className="font-medium">{sheet.rows} lignes</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Statistiques de la feuille {activeSheet}</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Nombre total de lignes:</span>
                          <span className="font-medium">{summary.totalRows}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Cellules vides:</span>
                          <span className="font-medium">{summary.blankCells}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Colonnes numériques:</span>
                          <span className="font-medium">{summary.numericColumns.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Colonnes textuelles:</span>
                          <span className="font-medium">{summary.textColumns.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Colonnes booléennes:</span>
                          <span className="font-medium">{summary.booleanColumns.length}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {summary.numericColumns.length > 0 && (
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold mb-3">Moyennes des colonnes numériques</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {summary.numericColumns.map((col) => (
                            <Card key={col} className="bg-gray-50">
                              <CardContent className="py-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">{col}:</span>
                                  <span className="font-medium text-blue-600">
                                    {summary.averages[col]?.toFixed(2)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default ExcelAnalyzer;
