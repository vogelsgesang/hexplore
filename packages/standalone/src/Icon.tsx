import React from "react";

import "./Icon.css";

export interface IconProps {
    icon: "arrow-up" | "arrow-down" | "trash";
}

export function Icon({icon}: IconProps) {
    return (
        <svg className={"hv-icon hv-icon-" + icon}>
            <use xlinkHref={"#icon-" + icon} />
        </svg>
    );
}

export function IconLibrary() {
    return (
        <svg aria-hidden="true" style={{position: "absolute", width: 0, height: 0, overflow: "hidden"}} version="1.1">
            <defs>
                <symbol id="icon-trash" viewBox="0 0 16 16">
                    <path d="M3 16h10l1-11h-12zM10 2v-2h-4v2h-5v3l1-1h12l1 1v-3h-5zM9 2h-2v-1h2v1z"></path>
                </symbol>
                <symbol id="icon-arrow-up" viewBox="0 0 16 16">
                    <path d="M8 0.5l-7.5 7.5h4.5v8h6v-8h4.5z"></path>
                </symbol>
                <symbol id="icon-arrow-down" viewBox="0 0 16 16">
                    <path d="M8 15.5l7.5-7.5h-4.5v-8h-6v8h-4.5z"></path>
                </symbol>
            </defs>
        </svg>
    );
}
