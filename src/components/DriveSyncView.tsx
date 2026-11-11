import React, { useState } from 'react';
import {
  Cloud,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Plus,
  FolderOpen,
  LogOut,
  AlertCircle,
  Database,
  RotateCcw,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSyncConfig, GoogleDriveSpreadsheet, Colaborador, Obra, RegistoHoras } from '../types';
import { GoogleSheetsService } from '../services/googleSheets';

interface DriveSyncViewProps {
  user: User | null;
  syncConfig: GoogleSyncConfig;
  colaboradores: Colaborador[];
  obras: Obra[];
  registos: RegistoHoras[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onUpdateSyncConfig: (cfg: GoogleSyncConfig) => void;
  onSyncNow: () => Promise<void>;
  onResetData: () => void;
  onClearAllRegistos?: () => void;
  onOpenMobileModal?: () => void;
}

export const DriveSyncView: React.FC<DriveSyncViewProps> = ({
  user,
  syncConfig,
  colaboradores,
  obras,
  registos,
  onSignIn,
  onSignOut,
  onUpdateSyncConfig,
  onSyncNow,
  onResetData,
  onClearAllRegistos,
  onOpenMobileModal,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isListing, setIsListing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableSheets, setAvailableSheets] = useState<GoogleDriveSpreadsheet[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  // Criar nova folha formatada no Google Drive
  const handleCreateSheet = async () => {
    setIsCreating(true);
    setStatusMessage(null);
    try {
      const result = await GoogleSheetsService.createTimesheetSpreadsheet(
        `ObraTempo - Registo de Horas (${new Date().getFullYear()})`
      );

      // Sincronizar dados iniciais
      await GoogleSheetsService.syncAllToSpreadsheet(
        result.id,
        colaboradores,
        obras,
        registos
      );

      onUpdateSyncConfig({
        ...syncConfig,
        spreadsheetId: result.id,
        spreadsheetName: result.name,
        spreadsheetUrl: result.url,
        lastSyncTime: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      });

      setStatusMessage({
        text: `Tabela "${result.name}" criada com sucesso no seu Google Drive!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        text: err.message || 'Erro ao criar folha de cálculo no Google Drive.',
        type: 'error',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Carregar lista de folhas existentes no Drive
  const handleListSheets = async () => {
    setIsListing(true);
    setStatusMessage(null);
    try {
      const files = await GoogleSheetsService.listSpreadsheets();
      setAvailableSheets(files);
      setShowFilePicker(true);
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Erro ao procurar ficheiros no Drive.',
        type: 'error',
      });
    } finally {
      setIsListing(false);
    }
  };

  // Selecionar uma folha existente
  const handleSelectSheet = (sheet: GoogleDriveSpreadsheet) => {
    onUpdateSyncConfig({
      ...syncConfig,
      spreadsheetId: sheet.id,
      spreadsheetName: sheet.name,
      spreadsheetUrl: sheet.webViewLink || `https://docs.google.com/spreadsheets/d/${sheet.id}`,
      lastSyncTime: null,
    });
    setShowFilePicker(false);
    setStatusMessage({
      text: `Ligado à tabela "${sheet.name}". Clique em "Sincronizar Agora" para enviar os registos.`,
      type: 'success',
    });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      await onSyncNow();
      setStatusMessage({
        text: 'Dados sincronizados com sucesso na folha do Google Drive!',
        type: 'success',
      });
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Erro ao sincronizar com o Google Drive.',
        type: 'error',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">Ligação Google Drive</h2>
        <p className="text-xs text-slate-500">
          Sincronize as horas trabalhadas diretamente numa folha de cálculo XLS / Google Sheets
        </p>
      </div>

      {/* Alertas de Estado */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CARD 1: ESTADO DA AUTENTICAÇÃO */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Conta Google
        </h3>

        {user ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Utilizador'}
                  className="w-10 h-10 rounded-full border border-slate-200 shadow-2xs"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  {user.displayName?.[0] || user.email?.[0] || 'G'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-slate-900 leading-tight">
                  {user.displayName || 'Utilizador Google'}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors cursor-pointer min-h-[38px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">
              Inicie sessão com a sua conta Google para ligar a aplicação ao seu Google Drive e gerir
              a tabela de registo de obras.
            </p>

            {/* Botão Oficial Sign in with Google */}
            <button
              onClick={onSignIn}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-300 rounded-xl shadow-2xs hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer min-h-[48px]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span className="text-sm font-semibold text-slate-700">Iniciar Sessão com o Google</span>
            </button>
          </div>
        )}
      </div>

      {/* CARD 2: TABELA LIGADA NO GOOGLE DRIVE */}
      {user && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tabela no Google Drive
            </h3>
            {syncConfig.spreadsheetId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ligada
              </span>
            )}
          </div>

          {syncConfig.spreadsheetId ? (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {syncConfig.spreadsheetName || 'Folha de Horas'}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      ID: <span className="font-mono">{syncConfig.spreadsheetId.slice(0, 16)}...</span>
                    </p>
                  </div>
                </div>

                {syncConfig.spreadsheetUrl && (
                  <a
                    href={syncConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 p-1.5"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {syncConfig.lastSyncTime && (
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>Última sincronização: hoje às {syncConfig.lastSyncTime}</span>
                </div>
              )}

              {/* Botões de sincronização */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-transform active:scale-[0.98] min-h-[44px] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'A sincronizar todas as aplicações...' : 'Sincronizar Todas as Aplicações'}</span>
                </button>
                <button
                  onClick={handleListSheets}
                  disabled={isListing}
                  className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors min-h-[44px] cursor-pointer"
                >
                  Alterar Tabela
                </button>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Ao sincronizar, esta aplicação descarrega novos registos inseridos noutros telemóveis e envia os registos locais.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Pode criar automaticamente uma folha formatada para a sua empresa ou ligar a um ficheiro
                existente no seu Google Drive.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleCreateSheet}
                  disabled={isCreating}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xs transition-transform active:scale-98 min-h-[48px] cursor-pointer"
                >
                  {isCreating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Criar Nova Folha no Drive</span>
                </button>

                <button
                  onClick={handleListSheets}
                  disabled={isListing}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors min-h-[48px] cursor-pointer"
                >
                  {isListing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                  <span>Escolher do Google Drive</span>
                </button>
              </div>
            </div>
          )}

          {/* Sincronização Automática */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Sincronização Automática</p>
              <p className="text-[11px] text-slate-500">
                Atualizar a tabela do Drive sempre que guardar registos
              </p>
            </div>
            <input
              type="checkbox"
              checked={syncConfig.autoSync}
              onChange={(e) =>
                onUpdateSyncConfig({ ...syncConfig, autoSync: e.target.checked })
              }
              className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* CARD 3: ESTRUTURA DA TABELA DE EXCEL / SHEETS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Estrutura da Tabela no Drive
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          A folha é estruturada em 3 separadores organizados para gestão da obra:
        </p>
        <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
          <li>
            <strong className="text-slate-900">Registos_Horas:</strong> Data, Colaborador, Função, Código
            Obra, Nome Obra, Cliente, Horas Normais, Horas Extra, Total e Tarefa.
          </li>
          <li>
            <strong className="text-slate-900">Colaboradores:</strong> Cadastro dos funcionários e horas
            base.
          </li>
          <li>
            <strong className="text-slate-900">Obras:</strong> Lista de obras, clientes e localizações.
          </li>
        </ul>
      </div>

      {/* CARD: ACESSO NO TELEMÓVEL */}
      {onOpenMobileModal && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Testar e Utilizar no Telemóvel</h4>
              <p className="text-[11px] text-slate-300">
                Gere um Código QR para abrir a aplicação e registar horas diretamente na obra
              </p>
            </div>
          </div>
          <button
            onClick={onOpenMobileModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-98 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Smartphone className="w-4 h-4" />
            <span>Ver Código QR</span>
          </button>
        </div>
      )}

      {/* CARD 4: GESTÃO DE DADOS (LIMPEZA E REPOSIÇÃO) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        {onClearAllRegistos && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-red-700">Limpar Registos de Horas</h4>
              <p className="text-[11px] text-slate-500">
                Apagar permanentemente todos os registos de horas diárias da aplicação
              </p>
            </div>
            <button
              onClick={onClearAllRegistos}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer min-h-[40px] shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Limpar Todos os Registos ({registos.length})</span>
            </button>
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800">Dados de Demonstração</h4>
            <p className="text-[11px] text-slate-500">Repor os dados de exemplo de obras e colaboradores</p>
          </div>
          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor</span>
          </button>
        </div>
      </div>

      {/* MODAL: SELETOR DE FOLHAS DO GOOGLE DRIVE */}
      {showFilePicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Escolha a Folha no seu Drive</h3>
              <button
                onClick={() => setShowFilePicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {availableSheets.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  Nenhuma folha de cálculo encontrada no seu Drive.
                </div>
              ) : (
                availableSheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => handleSelectSheet(sheet)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/20 cursor-pointer transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{sheet.name}</p>
                        <p className="text-[10px] text-slate-400">
                          Modificado: {sheet.modifiedTime?.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 shrink-0">Selecionar</span>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowFilePicker(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function ClockIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
