import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, Loader2, AlertTriangle, Database } from 'lucide-react';
import { importWodifyData, analyzeImportData, ImportResult } from './services/csvImportService';

interface FileState {
  file: File | null;
  content: string | null;
  status: 'empty' | 'loaded' | 'error';
}

const CSVImport: React.FC<{ onImportComplete?: () => void }> = ({ onImportComplete }) => {
  const [clients, setClients] = useState<FileState>({ file: null, content: null, status: 'empty' });
  const [attendance, setAttendance] = useState<FileState>({ file: null, content: null, status: 'empty' });
  const [memberships, setMemberships] = useState<FileState>({ file: null, content: null, status: 'empty' });
  const [prs, setPrs] = useState<FileState>({ file: null, content: null, status: 'empty' });
  
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<{
    totalClients: number;
    activeClients: number;
    inactiveClients: number;
    attendanceRecords: number;
    activeMemberships: number;
  } | null>(null);

  const handleFileUpload = useCallback((
    setter: React.Dispatch<React.SetStateAction<FileState>>,
    file: File
  ) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setter({ file, content, status: 'loaded' });
    };
    reader.onerror = () => {
      setter({ file, content: null, status: 'error' });
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((
    e: React.DragEvent,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(setter, file);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileState>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(setter, file);
    }
  }, [handleFileUpload]);

  // Update preview when required files are loaded
  React.useEffect(() => {
    if (clients.content && attendance.content && memberships.content) {
      try {
        const stats = analyzeImportData(clients.content, attendance.content, memberships.content);
        setPreview(stats);
      } catch (error) {
        console.error('Error analyzing data:', error);
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [clients.content, attendance.content, memberships.content]);

  const canImport = clients.status === 'loaded' && 
                    attendance.status === 'loaded' && 
                    memberships.status === 'loaded';

  const handleImport = async () => {
    if (!canImport || !clients.content || !attendance.content || !memberships.content) return;

    setImporting(true);
    setResult(null);

    try {
      const importResult = await importWodifyData(
        clients.content,
        attendance.content,
        memberships.content,
        prs.content || undefined
      );
      setResult(importResult);
      
      if (importResult.success && onImportComplete) {
        onImportComplete();
      }
    } catch (error) {
      setResult({
        success: false,
        membersImported: 0,
        milestonesImported: 0,
        errors: [(error as Error).message]
      });
    } finally {
      setImporting(false);
    }
  };

  const FileUploadBox = ({ 
    label, 
    description, 
    state, 
    setter, 
    required = true 
  }: { 
    label: string; 
    description: string; 
    state: FileState; 
    setter: React.Dispatch<React.SetStateAction<FileState>>;
    required?: boolean;
  }) => (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 ${
        state.status === 'loaded' 
          ? 'border-emerald-400 bg-emerald-50' 
          : state.status === 'error'
          ? 'border-rose-400 bg-rose-50'
          : 'border-slate-200 bg-white'
      }`}
      onDrop={(e) => handleDrop(e, setter)}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => document.getElementById(`file-${label}`)?.click()}
    >
      <input
        id={`file-${label}`}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFileInput(e, setter)}
      />
      
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-xl ${
          state.status === 'loaded' 
            ? 'bg-emerald-100 text-emerald-600' 
            : state.status === 'error'
            ? 'bg-rose-100 text-rose-600'
            : 'bg-slate-100 text-slate-400'
        }`}>
          {state.status === 'loaded' ? (
            <CheckCircle2 className="w-6 h-6" />
          ) : state.status === 'error' ? (
            <XCircle className="w-6 h-6" />
          ) : (
            <FileText className="w-6 h-6" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-bold text-slate-900">{label}</h4>
            {required && <span className="text-[10px] font-bold text-rose-500 uppercase">Required</span>}
            {!required && <span className="text-[10px] font-bold text-slate-400 uppercase">Optional</span>}
          </div>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
          
          {state.file && (
            <p className="text-xs font-medium text-indigo-600 mt-2">
              ✓ {state.file.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-indigo-100 rounded-xl">
          <Database className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Import Wodify Data</h2>
          <p className="text-sm text-slate-500">Upload your CSV exports to sync member data</p>
        </div>
      </div>

      {/* File Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <FileUploadBox
          label="Clients CSV"
          description="Wodify → Clients → Export"
          state={clients}
          setter={setClients}
          required
        />
        <FileUploadBox
          label="Attendance CSV"
          description="Wodify → Reports → Attendance → All Attendances"
          state={attendance}
          setter={setAttendance}
          required
        />
        <FileUploadBox
          label="Memberships CSV"
          description="Wodify → Reports → Memberships"
          state={memberships}
          setter={setMemberships}
          required
        />
        <FileUploadBox
          label="PRs CSV"
          description="Wodify → Reports → Performance Results → PRs"
          state={prs}
          setter={setPrs}
          required={false}
        />
      </div>

      {/* Preview Stats */}
      {preview && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h3 className="font-bold text-slate-900 mb-4">Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-2xl font-black text-slate-900">{preview.totalClients}</p>
              <p className="text-xs text-slate-500">Total Clients</p>
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{preview.activeClients}</p>
              <p className="text-xs text-slate-500">Active</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-400">{preview.inactiveClients}</p>
              <p className="text-xs text-slate-500">Inactive</p>
            </div>
            <div>
              <p className="text-2xl font-black text-indigo-600">{preview.attendanceRecords.toLocaleString()}</p>
              <p className="text-xs text-slate-500">Attendance Records</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{preview.activeMemberships}</p>
              <p className="text-xs text-slate-500">Active Memberships</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-slate-500">
          <AlertTriangle className="w-4 h-4" />
          <span>This will replace all existing data in the database</span>
        </div>
        
        <button
          onClick={handleImport}
          disabled={!canImport || importing}
          className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center space-x-3 ${
            canImport && !importing
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {importing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Importing...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Import Data</span>
            </>
          )}
        </button>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mt-6 p-6 rounded-2xl ${
          result.success 
            ? 'bg-emerald-50 border border-emerald-200' 
            : 'bg-rose-50 border border-rose-200'
        }`}>
          <div className="flex items-start space-x-3">
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
            )}
            <div>
              <h4 className={`font-bold ${result.success ? 'text-emerald-900' : 'text-rose-900'}`}>
                {result.success ? 'Import Successful!' : 'Import Failed'}
              </h4>
              <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                {result.success 
                  ? `Imported ${result.membersImported} members and ${result.milestonesImported} milestones`
                  : result.errors.join(', ')
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImport;
