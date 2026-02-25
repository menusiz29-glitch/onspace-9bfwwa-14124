import { Scale } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const tabs = [
    { id: 'asosiy', label: 'Asosiy' },
    { id: 'yechish', label: 'Kazus yechish' },
    { id: 'ustoz', label: 'Ustoz kabineti' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <header className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(221,83%,43%)] text-white shadow-lg animate-slide-down">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[hsl(43,96%,56%)] p-2 rounded-lg animate-bounce-slow">
              <Scale className="h-8 w-8 text-[hsl(221,83%,53%)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Law Exam System</h1>
              <p className="text-sm text-blue-100">Professional Legal Assessment Platform </p>
            </div>
          </div>
        </div>
        
        <nav className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95 hover:shadow-xl ${
                activeTab === tab.id
                  ? 'bg-white text-[hsl(221,83%,53%)] shadow-md animate-tab-select'
                  : 'bg-white/10 hover:bg-white/20 text-white hover:shadow-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes tab-select {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05) rotate(1deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-tab-select {
          animation: tab-select 0.3s ease-out;
        }
      `}</style>
    </header>
  );
}
