import React, { useState } from 'react';
import { Globe, Link as LinkIcon, X, ArrowRight, CheckCircle2, ShoppingBag } from 'lucide-react';

interface UrlExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExtracted: (text: string, rating: number | null) => void;
}

export const UrlExtractorModal: React.FC<UrlExtractorModalProps> = ({
  isOpen,
  onClose,
  onExtracted,
}) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickSamples = [
    {
      source: 'Amazon',
      product: 'Sony WH-1000XM5 Noise Canceling Headphones',
      rating: 5,
      url: 'https://www.amazon.com/dp/B09XS7JWHH/ref=cm_cr_arp_d_product_top',
      review:
        'The noise cancellation on these headphones is unmatched. I use them daily on the subway and they block out chatter and engine hum effortlessly. Battery life lasts all week on a single charge. Sound is balanced with warm bass.',
    },
    {
      source: 'Amazon (Suspected Bot)',
      product: 'Generic Smart Watch Ultra',
      rating: 5,
      url: 'https://www.amazon.com/dp/B0C7XYZ89/ref=cm_cr_fake_astroturf',
      review:
        'AMAZING PRODUCT! BEST WATCH EVER CREATED 100% QUALITY SUPER FAST SHIPPING BUY THIS NOW BEST SELLER IN THE WORLD FIVE STARS MUST BUY!!!',
    },
    {
      source: 'Google Reviews',
      product: 'Artisan Bistro & Espresso Bar',
      rating: 4,
      url: 'https://maps.google.com/?cid=1892837492817263',
      review:
        'Charming little brunch spot. The smoked salmon eggs benedict was delicious and coffee was properly pulled. Can get crowded on Sunday mornings with a 20-minute wait, but service was cheerful.',
    },
    {
      source: 'Yelp (Competitor Smear)',
      product: 'City Center Dental Care',
      rating: 1,
      url: 'https://www.yelp.com/biz/city-dental-review-dispute',
      review:
        'TOTAL SCAM ARTISTS! DO NOT EVER STEP FOOT HERE! THEY WILL RIP OFF YOUR MONEY AND RUIN YOUR TEETH. GO TO DENTAL CLINIC XYZ DOWN THE STREET INSTEAD!',
    },
  ];

  const handleFetch = (reviewText: string, reviewRating: number | null) => {
    setLoading(true);
    setTimeout(() => {
      onExtracted(reviewText, reviewRating);
      setLoading(false);
      onClose();
    }, 600);
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Simulate URL inspection and extract review
    const matchingSample = quickSamples.find((s) =>
      url.toLowerCase().includes(s.source.toLowerCase().split(' ')[0])
    ) || quickSamples[0];

    handleFetch(matchingSample.review, matchingSample.rating);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Review from E-Commerce URL
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extract reviews from Amazon, Yelp, Google, or Flipkart product pages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleCustomUrlSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Paste Product or Review Link:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.amazon.com/dp/... or https://maps.google.com/..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              {loading ? 'Extracting...' : 'Extract'}
            </button>
          </div>
        </form>

        {/* Quick E-Commerce Presets */}
        <div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wider text-[10px]">
            Or Select a Popular Verified Product Page:
          </span>
          <div className="space-y-2">
            {quickSamples.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleFetch(sample.review, sample.rating)}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                      {sample.source}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {sample.product}
                    </span>
                    <span className="text-xs text-amber-500 font-bold">★{sample.rating}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic">
                    "{sample.review}"
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

