import React from 'react';
import { Megaphone, Mail, Calendar, Users, BarChart } from 'lucide-react';

export function CampaignsSection() {
    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaigns</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Bulk outreach campaigns for cold members and special promotions.
                    </p>
                </div>
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2">
                    <Megaphone className="w-4 h-4" />
                    New Campaign
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-wider">Sent this month</p>
                        <p className="text-2xl font-black text-slate-900">0</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-wider">Engaged Members</p>
                        <p className="text-2xl font-black text-slate-900">0</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-600">
                        <BarChart className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-wider">Open Rate</p>
                        <p className="text-2xl font-black text-slate-900">0%</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Active Campaigns</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                    This section will allow you to create and send bulk campaigns to specific segments like "Summer Challenge" or "Win-Back".
                </p>
                <button className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                    Learn more about Campaigns &rarr;
                </button>
            </div>
        </div>
    );
}
