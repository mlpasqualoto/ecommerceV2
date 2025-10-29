"use client";
import { useEffect, useState } from "react";

export default function Toast() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        function onShow(e) {
            const { type = "info", message = "" } = e.detail || {};
            const id = Date.now() + Math.random();
            setToasts((t) => [...t, { id, type, message }]);
            // remove after 8s
            setTimeout(() => {
                setToasts((t) => t.filter((x) => x.id !== id));
            }, 8000);
        }

        window.addEventListener("show-toast", onShow);
        return () => window.removeEventListener("show-toast", onShow);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg border-l-4 overflow-hidden transform transition-all duration-200 ${t.type === "error"
                        ? "bg-red-50 border-red-600 text-red-800"
                        : t.type === "success"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                            : "bg-slate-50 border-slate-400 text-slate-800"
                        }`}
                >
                    <div className="text-sm font-medium">{t.message}</div>
                </div>
            ))}
        </div>
    );
}
