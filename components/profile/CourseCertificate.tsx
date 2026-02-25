import React from 'react'
import { Card } from '@/components/ui/card'
import { Trophy, Award, Landmark, CheckCircle2 } from 'lucide-react'

interface CourseCertificateProps {
    learnerName: string
    courseTitle: string
    completionDate: string
    certificateId: string
    rank: string
}

export const CourseCertificate: React.FC<CourseCertificateProps> = ({
    learnerName,
    courseTitle,
    completionDate,
    certificateId,
    rank
}) => {
    return (
        <Card className="relative w-full max-w-4xl aspect-[1.414/1] bg-[#fafafa] border-[12px] border-amber-500/10 overflow-hidden shadow-2xl flex flex-col items-center justify-between p-12 text-slate-800 font-serif">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
            </div>

            {/* Header */}
            <div className="w-full flex justify-between items-start z-10">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center ring-4 ring-amber-500/5">
                        <Landmark className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs font-sans font-bold uppercase tracking-[0.2em] text-amber-700">Academy Platform</p>
                        <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest">Excellence in Design</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest">Certificate No.</p>
                    <p className="text-xs font-sans font-mono font-medium">{certificateId}</p>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center text-center space-y-8 z-10 w-full">
                <div className="space-y-2">
                    <h1 className="text-3xl font-sans font-light uppercase tracking-[0.3em] text-slate-900">Certificate of Completion</h1>
                    <div className="w-24 h-0.5 bg-amber-500/30 mx-auto" />
                </div>

                <div className="space-y-4">
                    <p className="text-lg italic font-light text-slate-600">This is to certify that</p>
                    <h2 className="text-5xl font-bold tracking-tight text-slate-900 border-b-2 border-slate-900/5 pb-2 inline-block px-8">
                        {learnerName}
                    </h2>
                    <p className="text-lg italic font-light text-slate-600">has successfully completed the professional path in</p>
                    <h3 className="text-3xl font-sans font-bold text-amber-600 uppercase tracking-wider">
                        {courseTitle}
                    </h3>
                </div>

                <p className="max-w-xl text-sm font-sans text-slate-500 leading-relaxed italic">
                    "Demonstrating mastery in fundamental design principles, user research methodologies,
                    and high-fidelity prototyping as part of the professional Explorer curriculum."
                </p>
            </div>

            {/* Footer */}
            <div className="w-full flex justify-between items-end z-10 mt-8">
                <div className="space-y-2 text-center border-t border-slate-200 pt-4 w-48">
                    <p className="text-sm font-bold text-slate-900">Antigravity AI</p>
                    <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-[0.1em]">Lead Instructor</p>
                </div>

                {/* Seal */}
                <div className="relative group">
                    <div className="w-28 h-28 rounded-full bg-amber-500 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer">
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/20 animate-spin-slow" />
                        <div className="flex flex-col items-center text-white">
                            <Award className="w-10 h-10" />
                            <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">{rank}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 text-center border-t border-slate-200 pt-4 w-48">
                    <p className="text-sm font-bold text-slate-900">{completionDate}</p>
                    <p className="text-[10px] font-sans text-muted-foreground uppercase tracking-[0.1em]">Date of Issuance</p>
                </div>
            </div>

            {/* Social Proof / Checkmark */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-40">
                <CheckCircle2 className="w-3 h-3" />
                <span className="text-[8px] font-sans uppercase tracking-widest font-bold">Verified by Academy Blockchain Protocol</span>
            </div>
        </Card>
    )
}
