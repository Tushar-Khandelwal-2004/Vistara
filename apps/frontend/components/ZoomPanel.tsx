import { useState } from "react";
import {
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import clsx from "clsx";

export default function ZoomPanel({
  zoomLevel,
  zoomIn,
  zoomOut
}: {
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={clsx(
        "fixed bottom-5 left-5 bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
        expanded ? "w-35 p-3" : "w-20 p-2"
      )}
    >
      <div className="flex items-center justify-between">
        {!expanded ? (
          <>
            <div className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</div>
            <button
              onClick={() => setExpanded(true)}
              className="hover:scale-105 hover:bg-gray-100 p-1 transition"
            >
              <ChevronRight size={16} />
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between ">
            <button onClick={zoomOut} className="mt-1 p-1 hover:bg-gray-200 rounded">
              <Minus size={16} />
            </button>
            <div className="text-sm font-semibold text-center w-12">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button onClick={zoomIn} className="p-1 hover:bg-gray-200 rounded">
              <Plus size={16} />
            </button>
            <button
              onClick={() => setExpanded(false)}
              className="hover:bg-gray-100 p-1 rounded"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
