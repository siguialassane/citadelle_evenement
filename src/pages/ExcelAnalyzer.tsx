
// Ce fichier contient la page d'analyse de fichiers Excel
// Fonctionnalités:
// - Téléchargement de fichiers Excel
// - Analyse des données du fichier
// - Affichage et édition des données

import React, { useState } from "react";
import { read, utils } from "xlsx";
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
import { Info, FileSpreadsheet, Save, Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Type pour une ligne de données Excel
type ExcelRow = Record<string, string | number>;

const ExcelAnalyzer = () => {
  const navigate = useNavigate();
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [editableData, setEditableData] = useState<ExcelRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState<{
    totalRows: number;
    numericColumns: string[];
    textColumns: string[];
    averages: Record<string, number>;
  }>({
    totalRows: 0,
    numericColumns: [],
    textColumns: [],
    averages: {},
  });

  // Gestionnaire de téléchargement de fichier
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json<ExcelRow>(sheet);

        if (jsonData.length === 0) {
          setError("Le fichier Excel ne contient pas de données.");
          return;
        }

        // Extraire les colonnes
        const cols = Object.keys(jsonData[0]);
        setColumns(cols);
        setExcelData(jsonData);
        setEditableData(JSON.parse(JSON.stringify(jsonData)));

        // Analyser les données
        analyzeData(jsonData, cols);
      } catch (err) {
        setError("Erreur lors de la lecture du fichier Excel. Vérifiez le format du fichier.");
        console.error("Erreur de lecture du fichier Excel:", err);
      }
    };

    reader.onerror = () => {
      setError("Erreur lors de la lecture du fichier.");
    };

    reader.readAsBinaryString(file);
  };

  // Analyse des données pour le résumé
  const analyzeData = (data: ExcelRow[], cols: string[]) => {
    const numericCols: string[] = [];
    const textCols: string[] = [];
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};

    // Détecter les types de colonnes et calculer les sommes
    data.forEach((row) => {
      cols.forEach((col) => {
        const value = row[col];
        
        if (typeof value === 'number') {
          if (!numericCols.includes(col)) {
            numericCols.push(col);
          }
          
          if (!sums[col]) sums[col] = 0;
          if (!counts[col]) counts[col] = 0;
          
          sums[col] += value;
          counts[col]++;
        } else if (typeof value === 'string' && !textCols.includes(col)) {
          textCols.push(col);
        }
      });
    });

    // Calculer les moyennes
    const averages: Record<string, number> = {};
    numericCols.forEach((col) => {
      averages[col] = sums[col] / counts[col];
    });

    setSummary({
      totalRows: data.length,
      numericColumns: numericCols,
      textColumns: textCols,
      averages,
    });
  };

  // Gestion des modifications de cellule
  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...editableData];
    
    // Essayer de convertir en nombre si la colonne est numérique
    if (summary.numericColumns.includes(column)) {
      const numValue = parseFloat(value);
      newData[rowIndex][column] = isNaN(numValue) ? value : numValue;
    } else {
      newData[rowIndex][column] = value;
    }
    
    setEditableData(newData);
  };

  // Sauvegarder les modifications
  const saveChanges = () => {
    setExcelData(editableData);
    setIsEditing(false);
    // Mettre à jour l'analyse avec les nouvelles données
    analyzeData(editableData, columns);
  };

  // Exporter les données modifiées
  const exportData = () => {
    try {
      // Créer une feuille de calcul
      const ws = utils.json_to_sheet(editableData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Data");
      
      // Déclencher le téléchargement
      const exportFileName = fileName.replace(/\.[^/.]+$/, "") + "_modified.xlsx";
      // @ts-ignore - Cette fonction existe dans la bibliothèque xlsx
      utils.writeFile(wb, exportFileName);
    } catch (err) {
      setError("Erreur lors de l'exportation des données.");
      console.error("Erreur d'exportation:", err);
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
                accept=".xlsx, .xls"
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

      {/* Affichage et édition des données */}
      {excelData.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="data">
            <TabsList className="mb-4">
              <TabsTrigger value="data">Données</TabsTrigger>
              <TabsTrigger value="summary">Résumé</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Données du fichier ({excelData.length} lignes)</CardTitle>
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
                            <Upload className="h-4 w-4" />
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
                            <TableHead key={column}>{column}</TableHead>
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
                                    value={row[column]?.toString() || ""}
                                    onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                                    className="min-w-[100px]"
                                  />
                                ) : (
                                  row[column]?.toString() || ""
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
                      <h3 className="text-lg font-semibold mb-2">Statistiques générales</h3>
                      <ul className="space-y-2">
                        <li className="flex justify-between">
                          <span className="text-gray-600">Nombre total de lignes:</span>
                          <span className="font-medium">{summary.totalRows}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Colonnes numériques:</span>
                          <span className="font-medium">{summary.numericColumns.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-gray-600">Colonnes textuelles:</span>
                          <span className="font-medium">{summary.textColumns.length}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {summary.numericColumns.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Moyennes</h3>
                        <ul className="space-y-2">
                          {summary.numericColumns.map((col) => (
                            <li key={col} className="flex justify-between">
                              <span className="text-gray-600">Moyenne de {col}:</span>
                              <span className="font-medium">
                                {summary.averages[col]?.toFixed(2)}
                              </span>
                            </li>
                          ))}
                        </ul>
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
