import { ReactElement, ReactNode } from "react";
import "./Sidebar.css";
export interface SidebarTabProps {
    id: string;
    caption: string;
    children: ReactNode | ReactNode[];
}
export declare function SidebarTab({ children }: SidebarTabProps): JSX.Element;
export interface SidebarProps {
    children: ReactElement<SidebarTabProps> | ReactElement<SidebarTabProps>[];
    active: string | undefined;
    setActive: (a: string | undefined) => void;
    size?: number;
    setSize?: (s: number) => void;
}
export declare function TabbedSidebar({ active, setActive, size, setSize, children: reactChildren }: SidebarProps): JSX.Element;
//# sourceMappingURL=Sidebar.d.ts.map