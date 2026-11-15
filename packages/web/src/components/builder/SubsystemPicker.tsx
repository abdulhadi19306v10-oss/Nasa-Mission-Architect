import React, { useState } from 'react';
import {
  SpacecraftDesign,
  DataRegistry,
  Instrument,
  StructureSubsystem,
  PowerGenSubsystem,
  EnergyStorageSubsystem,
  AdcsSubsystem,
  CommsSubsystem,
  ObcSubsystem,
  ThermalSubsystem
} from '@sim/index';
import { SpacecraftViewer } from '../3d/SpacecraftViewer';
import {
  Layers,
  Zap,
  BatteryCharging,
  Compass,
  Radio,
  Cpu,
  Thermometer,
  Eye,
  Check,
  Plus,
  Trash2,
  ArrowRight
} from 'lucide-react';

interface SubsystemPickerProps {
  design: SpacecraftDesign;
  data: DataRegistry;
  onChangeDesign: (updater: (prev: SpacecraftDesign) => SpacecraftDesign) => void;
  onProceed: () => void;
}

type SubsystemTab = 'instruments' | 'structure' | 'power' | 'battery' | 'adcs' | 'comms' | 'avionics';

export const SubsystemPicker: React.FC<SubsystemPickerProps> = ({
  design,
  data,
  onChangeDesign,
  onProceed
}) => {
  const [activeTab, setActiveTab] = useState<SubsystemTab>('instruments');

  // Currently selected items
  const currentStructure = data.structures.find((s) => s.id === design.structureId) || data.structures[0];
  const currentPowerGen = data.powerGeneration.find((p) => p.id === design.powerGenId) || data.powerGeneration[0];
  const currentBattery = data.energyStorage.find((b) => b.id === design.energyStorageId) || data.energyStorage[0];
  const currentAdcs = data.adcs.find((a) => a.id === design.adcsId) || data.adcs[0];
  const currentComms = data.communications.find((c) => c.id === design.commsId) || data.communications[0];
  const currentObc = data.obc.find((o) => o.id === design.obcId) || data.obc[0];
  const currentThermal = data.thermal.find((t) => t.id === design.thermalId) || data.thermal[0];
  const selectedInstruments = data.instruments.filter((i) => design.instrumentIds.includes(i.id));

  // Instrument toggle helper
  const toggleInstrument = (instId: string) => {
    onChangeDesign((prev) => {
      const exists = prev.instrumentIds.includes(instId);
      return {
        ...prev,
        instrumentIds: exists
          ? prev.instrumentIds.filter((id) => id !== instId)
          : [...prev.instrumentIds, instId]
      };
    });
  };

  const tabs: { id: SubsystemTab; label: string; icon: React.ReactNode }[] = [
    { id: 'instruments', label: 'Payload Instruments', icon: <Eye className="w-4 h-4" /> },
    { id: 'structure', label: 'Bus Structure', icon: <Layers className="w-4 h-4" /> },
    { id: 'power', label: 'Solar Power', icon: <Zap className="w-4 h-4" /> },
    { id: 'battery', label: 'Energy Storage', icon: <BatteryCharging className="w-4 h-4" /> },
    { id: 'adcs', label: 'ADCS (Pointing)', icon: <Compass className="w-4 h-4" /> },
    { id: 'comms', label: 'Telecommunications', icon: <Radio className="w-4 h-4" /> },
    { id: 'avionics', label: 'OBC & Thermal', icon: <Cpu className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-cyan-400">PHASE 2: SPACE SEGMENT INTEGRATION</div>
          <h2 className="text-2xl font-bold text-white hud-heading">
            Spacecraft Subsystem Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Modular NASA Satellite Kit Assembly. Balance payload instrument performance against bus mass, power, and pointing budgets.
          </p>
        </div>
        <button
          onClick={onProceed}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold text-xs font-mono transition-all shadow-lg shadow-cyan-500/25"
        >
          <span>Select Launcher & Orbit</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left Controls (55%), Right 3D Visualizer (45%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Subsystem Selector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Subsystem Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-space-900 border border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Instruments */}
          {activeTab === 'instruments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Select scientific instruments ({selectedInstruments.length} mounted)</span>
                <span>Max bus payload: {currentStructure.maxPayloadMassKg} kg</span>
              </div>
              <div className="grid grid-cols-1 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                {data.instruments.map((inst) => {
                  const isMounted = design.instrumentIds.includes(inst.id);
                  return (
                    <div
                      key={inst.id}
                      onClick={() => toggleInstrument(inst.id)}
                      className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                        isMounted
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-space-850 text-cyan-400 border border-cyan-900">
                              {inst.category}
                            </span>
                            <h4 className="text-sm font-bold text-white">{inst.name}</h4>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {inst.description}
                          </p>
                        </div>
                        <button
                          className={`p-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0 ${
                            isMounted
                              ? 'bg-cyan-500 text-black border-cyan-400'
                              : 'bg-space-850 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {isMounted ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Specs bar */}
                      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Mass: <strong className="text-cyan-400">{inst.massKg} kg</strong></span>
                        <span>Power: <strong className="text-amber-400">{inst.powerWatts} W</strong></span>
                        <span>Data: <strong className="text-sky-300">{inst.dataRateMbps} Mbps</strong></span>
                        <span>Cost: <strong className="text-emerald-400">${inst.costM}M</strong></span>
                        <span>Req. Pointing: <strong className="text-white">±{inst.minPointingAccuracyDeg}°</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Bus Structure */}
          {activeTab === 'structure' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono">
                Select satellite primary structure platform
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.structures.map((struct) => {
                  const isSelected = struct.id === design.structureId;
                  return (
                    <div
                      key={struct.id}
                      onClick={() => onChangeDesign((prev) => ({ ...prev, structureId: struct.id }))}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{struct.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">${struct.costM}M</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{struct.description}</p>
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Dry Mass: <strong className="text-cyan-400">{struct.dryMassKg} kg</strong></span>
                        <span>Max Payload Limit: <strong className="text-amber-400">{struct.maxPayloadMassKg} kg</strong></span>
                        <span>Shape: <strong className="text-slate-200 capitalize">{struct.shape}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Power Generation */}
          {activeTab === 'power' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono">
                Select solar array wings or nuclear RTG generator
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.powerGeneration.map((pwr) => {
                  const isSelected = pwr.id === design.powerGenId;
                  return (
                    <div
                      key={pwr.id}
                      onClick={() => onChangeDesign((prev) => ({ ...prev, powerGenId: pwr.id }))}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{pwr.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">${pwr.costM}M</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{pwr.description}</p>
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Output: <strong className="text-amber-400">{pwr.powerOutputWatts} W</strong></span>
                        <span>Mass: <strong className="text-cyan-400">{pwr.massKg} kg</strong></span>
                        <span>Sun Tracking: <strong className="text-slate-200">{pwr.sunTracking ? 'Active Dual-Axis' : 'Fixed'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 4: Energy Storage */}
          {activeTab === 'battery' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono">
                Select space-qualified lithium-ion battery capacity
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.energyStorage.map((bat) => {
                  const isSelected = bat.id === design.energyStorageId;
                  return (
                    <div
                      key={bat.id}
                      onClick={() => onChangeDesign((prev) => ({ ...prev, energyStorageId: bat.id }))}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{bat.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">${bat.costM}M</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{bat.description}</p>
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Capacity: <strong className="text-amber-400">{bat.capacityWh} Wh</strong></span>
                        <span>Max Safe DoD: <strong className="text-cyan-400">{(bat.maxDoD * 100).toFixed(0)}%</strong></span>
                        <span>Mass: <strong className="text-slate-200">{bat.massKg} kg</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 5: ADCS */}
          {activeTab === 'adcs' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono">
                Attitude Determination & Control System (Pointing Stability)
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.adcs.map((item) => {
                  const isSelected = item.id === design.adcsId;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onChangeDesign((prev) => ({ ...prev, adcsId: item.id }))}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">${item.costM}M</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Pointing Accuracy: <strong className="text-cyan-400">±{item.pointingAccuracyDeg}°</strong></span>
                        <span>Power Draw: <strong className="text-amber-400">{item.powerWatts} W</strong></span>
                        <span>Requires B-Field: <strong className="text-slate-200">{item.requiresMagneticField ? 'Yes (LEO only)' : 'No (Deep Space ready)'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 6: Comms */}
          {activeTab === 'comms' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono">
                Telecommunications Antenna & Transmitter
              </div>
              <div className="grid grid-cols-1 gap-3">
                {data.communications.map((comm) => {
                  const isSelected = comm.id === design.commsId;
                  return (
                    <div
                      key={comm.id}
                      onClick={() => onChangeDesign((prev) => ({ ...prev, commsId: comm.id }))}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white">{comm.name}</h4>
                        <span className="text-xs font-mono font-bold text-emerald-400">${comm.costM}M</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{comm.description}</p>
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-300">
                        <span>Downlink Throughput: <strong className="text-sky-300">{comm.downlinkRateMbps} Mbps</strong></span>
                        <span>Power Draw: <strong className="text-amber-400">{comm.powerWatts} W</strong></span>
                        <span>Pointing Tolerance: <strong className="text-cyan-400">±{comm.pointingToleranceDeg}°</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 7: Avionics & Thermal */}
          {activeTab === 'avionics' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-mono">Onboard Flight Computer (OBC)</div>
                <div className="grid grid-cols-1 gap-2.5">
                  {data.obc.map((obcItem) => {
                    const isSelected = obcItem.id === design.obcId;
                    return (
                      <div
                        key={obcItem.id}
                        onClick={() => onChangeDesign((prev) => ({ ...prev, obcId: obcItem.id }))}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{obcItem.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-400">${obcItem.costM}M</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{obcItem.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-slate-300">
                          <span>Storage: <strong className="text-cyan-400">{obcItem.storageGb} GB</strong></span>
                          <span>Power: <strong className="text-amber-400">{obcItem.powerWatts} W</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs text-slate-400 font-mono">Thermal Regulation Subsystem</div>
                <div className="grid grid-cols-1 gap-2.5">
                  {data.thermal.map((thm) => {
                    const isSelected = thm.id === design.thermalId;
                    return (
                      <div
                        key={thm.id}
                        onClick={() => onChangeDesign((prev) => ({ ...prev, thermalId: thm.id }))}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10'
                            : 'bg-space-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{thm.name}</h4>
                          <span className="text-xs font-mono font-bold text-emerald-400">${thm.costM}M</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{thm.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-slate-300">
                          <span>Power: <strong className="text-amber-400">{thm.powerWatts} W</strong></span>
                          <span>Mass: <strong className="text-cyan-400">{thm.massKg} kg</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: 3D Visualizer & Quick Telemetry Preview */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          <div className="hud-panel p-3 rounded-2xl border border-cyan-500/30">
            <div className="flex items-center justify-between pb-2 px-1">
              <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                3D CAD Spacecraft Preview
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                NASA Satellite Kit
              </span>
            </div>
            <div className="h-[400px]">
              <SpacecraftViewer
                design={design}
                structure={currentStructure}
                powerGen={currentPowerGen}
                comms={currentComms}
                selectedInstruments={selectedInstruments}
              />
            </div>
          </div>

          {/* Quick Subsystem Inventory */}
          <div className="bg-space-900/80 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider">Mounted Architecture</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Bus: <span className="text-white font-medium">{currentStructure.name}</span></div>
              <div>Power: <span className="text-white font-medium">{currentPowerGen.name}</span></div>
              <div>Battery: <span className="text-white font-medium">{currentBattery.name}</span></div>
              <div>ADCS: <span className="text-white font-medium">{currentAdcs.name}</span></div>
              <div>Comms: <span className="text-white font-medium">{currentComms.name}</span></div>
              <div>Instruments: <span className="text-cyan-400 font-medium">{selectedInstruments.length} Active</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
