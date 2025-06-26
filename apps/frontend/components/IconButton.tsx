import { ReactNode } from "react";

export function IconButton({
    icon,
    onclick,
    activated
}: {
    icon: ReactNode,
    onclick: () => void,
    activated: boolean
}) {
    return (
        <div className={`cursor-pointer rounded-full border p-2 hover:bg-slate-200 m-2 ${activated ? "bg-slate-200" : ""} `} onClick={onclick}>
            {icon}
        </div>
    )
}