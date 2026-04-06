import Image from "next/image";

const Loading = () => {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#0b1a2b] text-[#e6f0ff] font-sans">

      {/* LEFT */}
      <div className="w-full h-1/2 md:h-full md:w-2/5 flex flex-col justify-center items-center gap-3 border-b md:border-b-0 md:border-r border-white/10 p-6">
        <Image src="/logo2.png" alt="Prava AI" width={70} height={70} />
        
        <h2 className="text-xl font-semibold">Prava AI</h2>
        
        <p className="text-xs opacity-60 text-center">
          Plan • Explore • Travel Smart
        </p>
      </div>

      {/* RIGHT */}
      <div className="w-full h-1/2 text-center md:text-left md:h-full md:w-3/5 flex flex-col justify-center px-6 md:px-16 gap-4 animate-fade">

        <h1 className="text-lg md:text-xl font-semibold">
          Loading your journey...
        </h1>

        <p className="text-sm opacity-60">
          Preparing your travel experience
        </p>

        {/* Progress Bar */}
        <div className="w-full h-[4px] bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-blue-400 rounded-full animate-loadingBar"></div>
        </div>

      </div>

      {/* Animations */}
      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .animate-loadingBar {
          animation: loadingBar 2s ease-in-out infinite;
        }

        @keyframes fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fade {
          animation: fade 0.6s ease;
        }
      `}</style>

    </div>
  );
};

export default Loading;

export const ViewTripLoading = () => {
  return (
    <div className="min-h-[90vh] flex items-center justify-center ">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 blur-xl bg-indigo-500/20 dark:bg-indigo-400/10 rounded-full animate-pulse"></div>
          <Image src="/aiLoading.gif" alt="loading" width={250} height={250} unoptimized    />
        </div>
        <span className="text-xl font-semibold dark:text-white text-gray-800">
          Loading Trip Details...
        </span>
      </div>
    </div>
  );
};

export const GenPlanLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center h-dvh md:h-[80vh] gap-4">
      <div className="flex items-center -gap-x-4">

        <Image src="/genLoading.gif" alt="loading" width={250} height={250} className="-mr-8" unoptimized     />

        {/* Stroke Text Animation */}
        <svg viewBox="0 0 400 80" width="400" height="80" className="-ml-8">
          <text
            x="50%"
            y="65"
            textAnchor="middle"
            fontFamily="inherit"
            fontSize="52"
            fontWeight="bold"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1200,
              strokeDashoffset: 1200,
              animation: "drawText 2.5s ease-in-out infinite alternate",
            }}
          >
            Generating
          </text>
        </svg>
      </div>

      <p className="text-base text-gray-500 dark:text-gray-400 tracking-widest uppercase">
        your perfect trip...
      </p>

      <style>{`
        @keyframes drawText {
          0%   { stroke-dashoffset: 1200; opacity: 1; }
          70%  { stroke-dashoffset: 0;    opacity: 1; }
          85%  { stroke-dashoffset: 0;    opacity: 0.2; }
          100% { stroke-dashoffset: 1200; opacity: 0.2; }
        }
      `}</style>

    </div>
  );
};
