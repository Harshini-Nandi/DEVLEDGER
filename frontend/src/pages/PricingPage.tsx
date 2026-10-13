import React from 'react';
import { Check, Cpu, Info } from 'lucide-react';
import { Button } from '../components/common/Button';

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/ month',
      description: 'Ideal for solo gig workers and individuals managing simple personal or freelance expenses.',
      badge: null,
      features: [
        'Up to 30 monthly document extractions',
        'Standard PyMuPDF & OCR image parser',
        'Basic categorization & ledger tagging',
        'CSV transaction exports',
        'Local SQLite data persistence',
        'Community documentation support',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline' as const,
      highlight: false,
    },
    {
      name: 'Freelancer',
      price: '$19',
      period: '/ month',
      description: 'Designed for independent consultants, contractors, and side-hustle agency founders.',
      badge: 'Most Popular',
      features: [
        'Up to 150 monthly document extractions',
        'Local Ollama AI structured reasoning',
        'Automated duplicate receipt detection',
        'Month-over-month trend forecasting',
        'Customizable expense categories',
        'Printable monthly financial reports',
        'Priority feature updates',
      ],
      buttonText: 'Start 14-Day Evaluation',
      buttonVariant: 'primary' as const,
      highlight: true,
    },
    {
      name: 'Small Business',
      price: '$39',
      period: '/ month',
      description: 'For growing micro-agencies, partnerships, and multi-contractor businesses.',
      badge: 'Best Value',
      features: [
        'Unlimited local document extractions',
        'Multi-currency processing & conversion',
        'Advanced tax-deductible expense tracking',
        'Fine-tuned local open-weight prompt profiles',
        'Automated data backup & retention policies',
        'Zero per-document cloud API markups',
        'Direct developer setup support',
      ],
      buttonText: 'Contact for Enterprise Deploy',
      buttonVariant: 'outline' as const,
      highlight: false,
    },
  ];

  return (
    <div className="space-y-10 max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Side-Hustle Monetization Model
        </span>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Transparent, Predictable Pricing for Independent Operators
        </h2>
        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
          OpenLedger AI eliminates recurring cloud LLM token surcharges by running models directly on your hardware. These illustrative tiers showcase our commercial SaaS model.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl p-6 flex flex-col justify-between transition-all ${
              p.highlight
                ? 'bg-white border-2 border-emerald-500 shadow-xl ring-4 ring-emerald-500/10 relative'
                : 'bg-white border border-slate-200 shadow-card hover:border-slate-300'
            }`}
          >
            {p.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-sm">
                {p.badge}
              </span>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>

              <div className="my-5 pb-5 border-b border-slate-100">
                <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                <span className="text-xs text-slate-400 font-medium ml-1">{p.period}</span>
                <span className="block text-[11px] text-slate-400 mt-0.5">Illustrative pricing plan</span>
              </div>

              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-700 block">Features included:</span>
                {p.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <Button variant={p.buttonVariant} size="md" className="w-full">
                {p.buttonText}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Economic Comparison: Local AI vs Paid Proprietary APIs */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-bold">
              The Economics of Local Open-Weight AI
            </h3>
            <p className="text-xs text-slate-400">
              Why running Ollama locally outclasses per-document proprietary cloud API charges
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <span>✕ Proprietary Cloud APIs (OpenAI / Claude / Gemini)</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• Charges $0.02 to $0.06 per scanned receipt image or PDF token batch.</li>
              <li>• Stacking bills: 200 documents/mo quickly costs $8 - $12 in pure API fees.</li>
              <li>• Private financial receipts and company invoices cross public internet networks.</li>
              <li>• Vulnerable to API rate limits, pricing hikes, and unexpected vendor changes.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <span>✓ OpenLedger AI with Local Ollama Inference</span>
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong>$0.00 per-token cost:</strong> Run 10 or 10,000 documents without paying API bills.</li>
              <li>• <strong>Absolute Privacy:</strong> Zero financial data is ever transmitted to remote servers.</li>
              <li>• <strong>Open Innovation:</strong> Swap model weights easily between Llama 3.2, Qwen 2.5, or Mistral.</li>
              <li>• <strong>Predictable Budget:</strong> You utilize the compute power you already own.</li>
            </ul>
          </div>
        </div>

        {/* Hardware & Realistic Tradeoffs Disclosure */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-100">Hardware & Trade-off Transparency:</span>
            <p>
              Local AI models require suitable host hardware. A computer with at least 8GB of RAM and a modern 4+ core CPU (or Apple M-series / NVIDIA GPU) is recommended for fast local inference. Cloud LLMs may exhibit higher OCR accuracy on severely damaged or blurry handwriting; however, for standard business invoices and PDFs, local models combined with PyMuPDF deliver enterprise-grade accuracy with zero data leakage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
