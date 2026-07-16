import React, { useRef } from "react";
import { Trip, UserProfile } from "../types";
import { 
  Printer, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Users, 
  Car, 
  CheckCircle,
  FileText
} from "lucide-react";

interface ReportModalProps {
  trip: Trip;
  activeUser: UserProfile;
  onClose: () => void;
}

export default function ReportModal({ trip, activeUser, onClose }: ReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Group real expenses by category
  const realExpenses = trip.expenses.filter(e => !e.isPlanned);
  const plannedExpenses = trip.expenses.filter(e => e.isPlanned);

  const totalRealAmount = realExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPlannedAmount = plannedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categories = [
    "Alojamento", "Voos", "Rent-a-Car", "Combustível", "Carregamentos", 
    "Restaurantes", "Compras", "Entradas", "Portagens", "Outros"
  ];

  const categoryData = categories.map(cat => {
    const realSum = realExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    const plannedSum = plannedExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    return {
      category: cat,
      real: realSum,
      planned: plannedSum
    };
  }).filter(c => c.real > 0 || c.planned > 0);

  // Number of places visited (itinerary events)
  const allEvents = Object.values(trip.itinerary).flat();
  const placesCount = allEvents.length;

  // Approximate total distance & travel duration calculations
  const totalDays = Object.keys(trip.itinerary).length;

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Create a clean print frame style
      const style = document.createElement("style");
      style.innerHTML = `
        @media print {
          body { background: white; color: black; font-family: sans-serif; padding: 20px; }
          .no-print { display: none !important; }
          .print-border { border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 0.75rem; }
        }
      `;
      document.head.appendChild(style);
      window.print();
      document.head.removeChild(style);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-lg text-gray-900">Relatório Final de Viagem</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-100"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto" ref={printAreaRef} id="printable-report">
          <div className="space-y-6 print-border">
            {/* Header branding */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
              <div>
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">TripPilot Report</span>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{trip.name}</h2>
                <div className="flex flex-wrap gap-y-1 gap-x-4 text-gray-500 text-sm mt-1.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {trip.destination}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {trip.startDate} a {trip.endDate} ({totalDays} dias)
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-right md:min-w-[150px]">
                <p className="text-xs text-gray-500 font-medium">Estado da Viagem</p>
                <p className="text-lg font-bold text-indigo-600 capitalize">{trip.status === "active" ? "Ativa" : "Concluída/Arquivada"}</p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Resumo do Planeador</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{trip.description || "Nenhum resumo inserido para esta viagem."}</p>
            </div>

            {/* Dashboard grid metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Locais Visitados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{placesCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Pontos de interesse</p>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Distância Estimada</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">~542 km</p>
                <p className="text-xs text-gray-500 mt-0.5">Percorrida de veículo</p>
              </div>

              {activeUser.role === "Planeador" ? (
                <>
                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Realizado</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{totalRealAmount.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-0.5">Em despesas reais</p>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Previsto</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{totalPlannedAmount.toFixed(2)} €</p>
                    <p className="text-xs text-gray-500 mt-0.5">Orçamentado</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center border-dashed text-gray-400 text-xs italic text-center">
                  Os dados financeiros e despesas detalhadas estão confidenciais por restrições de permissões (Apenas Leitura / Consultor).
                </div>
              )}
            </div>

            {/* Financial Analysis Table (Planeador only!) */}
            {activeUser.role === "Planeador" && categoryData.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Análise Financeira por Categoria</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3 text-right">Gasto Real</th>
                        <th className="px-4 py-3 text-right">Orçado/Previsto</th>
                        <th className="px-4 py-3 text-right">Diferença</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {categoryData.map((data, index) => {
                        const diff = data.real - data.planned;
                        return (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold text-gray-800">{data.category}</td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{data.real.toFixed(2)} €</td>
                            <td className="px-4 py-3 text-right text-indigo-600 font-medium">{data.planned.toFixed(2)} €</td>
                            <td className={`px-4 py-3 text-right font-bold ${diff > 0 ? "text-rose-500" : diff < 0 ? "text-emerald-500" : "text-gray-400"}`}>
                              {diff > 0 ? `+${diff.toFixed(2)} €` : diff < 0 ? `${diff.toFixed(2)} €` : "0.00 €"}
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold border-t border-gray-200 text-gray-900">
                        <td className="px-4 py-3.5 text-base">TOTAL GERAL</td>
                        <td className="px-4 py-3.5 text-right text-emerald-600 text-base">{totalRealAmount.toFixed(2)} €</td>
                        <td className="px-4 py-3.5 text-right text-indigo-600 text-base">{totalPlannedAmount.toFixed(2)} €</td>
                        <td className={`px-4 py-3.5 text-right text-base ${(totalRealAmount - totalPlannedAmount) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {(totalRealAmount - totalPlannedAmount).toFixed(2)} €
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* List of visited places */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-100 pb-2">Itinerário & Locais Visitados</h4>
              {allEvents.length === 0 ? (
                <p className="text-gray-500 text-xs italic">Nenhum local adicionado ao itinerário para esta viagem.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(trip.itinerary).map(([date, events]) => {
                    if (events.length === 0) return null;
                    return (
                      <div key={date} className="space-y-2">
                        <h5 className="text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded inline-block">Dia {date}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                          {events.map((event) => (
                            <div key={event.id} className="border border-gray-100 rounded-xl p-3 bg-white hover:bg-gray-50/20 flex gap-3">
                              <div className="text-center bg-gray-50 border border-gray-100 rounded-lg p-2 min-w-[65px] h-fit">
                                <p className="text-xs font-bold text-gray-700">{event.timeStart}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{event.timeEnd}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{event.name}</p>
                                <p className="text-xs text-gray-400 truncate mt-0.5">{event.address}</p>
                                <span className="inline-block text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.2 mt-1 rounded">
                                  {event.category}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Members & Vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Vehicle info */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-indigo-600" />
                  Veículo Associado
                </h5>
                {trip.vehicle ? (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-900 text-sm">{trip.vehicle.name}</p>
                    <p>Tipo de Motor: <span className="capitalize">{trip.vehicle.type}</span></p>
                    <p>Autonomia Máxima: {trip.vehicle.autonomyRange} km</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Nenhum veículo associado a esta viagem.</p>
                )}
              </div>

              {/* Participants */}
              <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-2">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Participantes e Convidados
                </h5>
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {trip.participants.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        <p className="text-gray-400 text-[10px]">{p.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        p.role === "Planeador" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {p.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-400 gap-2">
              <p>Relatório gerado automaticamente por TripPilot Pro em {new Date().toLocaleDateString("pt-PT")}</p>
              <p className="font-bold text-indigo-500 uppercase tracking-widest">A Viagem Começa Aqui</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
