import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Mail, CheckCircle2 } from 'lucide-react';
import { Member } from './types';

interface MessageModalProps {
    member: Member | null;
    isOpen: boolean;
    onClose: () => void;
    onShowToast: (message: string, type?: 'success' | 'error') => void;
}

const TEMPLATES = [
    {
        id: 'at-risk',
        label: 'At-Risk Check-in',
        content: "Hi [Name], we missed you at [GymName] lately! It's been [Days] days since your last workout. Is everything okay? Let us know if we can help you get back on track! 💪"
    },
    {
        id: 'expiry',
        label: 'Membership Expiring',
        content: "Hi [Name], just a friendly reminder that your membership expires in [DaysUntil] days. Let's get you renewed so you don't lose your momentum! 🔄"
    },
    {
        id: 'win-back',
        label: 'Win-Back Message',
        content: "Hi [Name], it's been a while! We've made some great upgrades to the gym and would love to see you back. Here's a free pass for a drop-in this week! 🎟️"
    },
    {
        id: 'custom',
        label: 'Custom Message',
        content: ""
    }
];

const MessageModal: React.FC<MessageModalProps> = ({ member, isOpen, onClose, onShowToast }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
    const [message, setMessage] = useState('');
    const [markContacted, setMarkContacted] = useState(true);

    // Update message when template or member changes
    useEffect(() => {
        if (member && isOpen) {
            const template = TEMPLATES.find(t => t.id === selectedTemplate);
            if (template) {
                let text = template.content;
                text = text.replace('[Name]', member.name.split(' ')[0]);
                text = text.replace('[GymName]', 'IronForge Gym'); // Use actual gym name if available

                const daysInactive = Math.floor((new Date().getTime() - new Date(member.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24));
                text = text.replace('[Days]', daysInactive.toString());

                const daysUntil = Math.floor((new Date(member.membershipExpires).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                text = text.replace('[DaysUntil]', Math.max(0, daysUntil).toString());

                setMessage(text);
            }
        }
    }, [selectedTemplate, member, isOpen]);

    if (!isOpen || !member) return null;

    const handleSend = (type: 'whatsapp' | 'email') => {
        if (type === 'whatsapp') {
            window.open(`https://wa.me/${member.phone}?text=${encodeURIComponent(message)}`, '_blank');
            onShowToast('WhatsApp opened', 'success');
        } else {
            window.open(`mailto:${member.email}?subject=Message from IronForge&body=${encodeURIComponent(message)}`, '_blank');
            onShowToast('Email client opened', 'success');
        }

        if (markContacted) {
            // In a real app, this would call an API
            onShowToast(`Marked ${member.name} as contacted`, 'success');
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">Message Member</h3>
                            <p className="text-sm font-bold text-slate-400">To: {member.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Template Selector */}
                <div className="mb-6">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Template</label>
                    <div className="grid grid-cols-2 gap-2">
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all ${selectedTemplate === t.id
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message Editor */}
                <div className="mb-6">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message Content</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none"
                    />
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col gap-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${markContacted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                            {markContacted && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={markContacted}
                            onChange={(e) => setMarkContacted(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-xs font-bold text-slate-600">Mark as contacted automatically</span>
                    </label>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSend('whatsapp')}
                            className="flex items-center justify-center py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg shadow-emerald-200"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Send WhatsApp
                        </button>
                        <button
                            onClick={() => handleSend('email')}
                            className="flex items-center justify-center py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg shadow-slate-200"
                        >
                            <Mail className="w-4 h-4 mr-2" /> Send Email
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MessageModal;
