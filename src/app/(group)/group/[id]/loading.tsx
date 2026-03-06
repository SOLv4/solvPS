export default function Loading() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-8 space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white rounded-3xl p-10 border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                        <div className="h-4 w-24 bg-slate-100 rounded-full" />
                        <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-12 w-40 bg-slate-100 rounded-2xl" />
                        <div className="h-12 w-32 bg-slate-100 rounded-2xl" />
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Board Skeleton */}
                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 h-[400px]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-slate-100" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                                <div className="h-3 w-48 bg-slate-100 rounded-lg" />
                            </div>
                        </div>
                        <div className="w-full h-64 bg-slate-50 rounded-2xl" />
                    </div>

                    {/* Code Compare Skeleton */}
                    <div className="bg-white rounded-[32px] border border-slate-200 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-slate-100" />
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-slate-200 rounded-lg" />
                                <div className="h-3 w-48 bg-slate-100 rounded-lg" />
                            </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-32 bg-slate-50 rounded-[20px]" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Skeleton */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[32px] border border-slate-200 p-8 h-[600px]">
                        <div className="h-6 w-32 bg-slate-200 rounded-lg mb-6" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-slate-50 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
