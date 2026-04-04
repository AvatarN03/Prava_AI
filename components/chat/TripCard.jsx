import { Copy, Save } from "lucide-react"; 

import { Button } from "@/components/ui/button";

export const TripCard = ({ trip, onSave, isSaving }) => {
  const tripTitle = trip.title || trip.destination;

  return (
    <div className="w-full flex justify-center mb-6">
      <div className="w-full max-w-[350px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 overflow-hidden transform transition-all hover:scale-[1.01]">

        {/* Header - Purple/Fuchsia gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-5 text-white">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold opacity-90 mb-1.5">
            <span className="opacity-100">🌍</span> Destination
          </div>
          <h3 className="font-bold text-[24px] leading-tight mb-3 tracking-tight">
            {tripTitle}
          </h3>
          <div className="flex items-center gap-5 text-[13px] font-medium opacity-95">
            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md">
              <span>📅</span> {trip.duration}
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-md">
              <span>💰</span> {trip.budget || trip.total_estimated_cost} {trip.currency || "INR"}
            </span>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-0 bg-white/60">
          {trip.itinerary && Array.isArray(trip.itinerary) && trip.itinerary.slice(0, 2).map((day, idx) => (
            <div key={idx} className="flex gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-violet-50/50 transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-sm border border-violet-200">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-[15px] text-gray-800 tracking-tight">{day.theme || `Day ${idx + 1}`}</h4>
                  <span className="text-violet-300 font-bold">›</span>
                </div>
                {day.plan && day.plan.length > 0 && (
                  <p className="text-[13px] text-gray-500 truncate max-w-[280px]">
                    {day.plan.map(p => p.place).join(' • ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Button Actions */}
        <div className="p-4 pt-3 bg-white/80">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold py-5 rounded-xl shadow-md hover:shadow-lg hover:shadow-fuchsia-500/30 transition-all flex items-center justify-center gap-2 transform"
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Itinerary"}
          </Button>
        </div>

      </div>
    </div>
  );
};