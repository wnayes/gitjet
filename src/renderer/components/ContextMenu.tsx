import { Children, FC, ReactElement, ReactNode } from "react";
import { IMenuItemOptions } from "../../shared/ContextMenu";

export interface IContextMenuItemProps {
  label: string;
  onClick(): void;
}

export const ContextMenuItem: FC<IContextMenuItemProps> = () => {
  return null;
};

export interface IContextMenuSeparatorProps {}

export const ContextMenuSeparator: FC<IContextMenuSeparatorProps> = () => {
  return null;
};

export interface IContextMenuProps {
  children: ReactNode;
}

export const ContextMenu: FC<IContextMenuProps> = () => {
  return null;
};

export function showContextMenu(items: ReactElement<IContextMenuProps>): void {
  let i = 0;
  const handlers: (VoidFunction | null)[] = [];
  const menuItems: IMenuItemOptions[] = Children.map(
    items.props.children,
    (child) => {
      if (!child || typeof child !== "object" || !("type" in child)) return;
      if (child.type === ContextMenuItem) {
        handlers.push((child.props as IContextMenuItemProps).onClick);
        return {
          label: (child.props as IContextMenuItemProps).label,
        };
      }
      if (child.type === ContextMenuSeparator) {
        handlers.push(null);
        return { type: "separator" as const };
      }
      return null;
    }
  )!.filter((item) => !!item);

  gitjetCommon.showContextMenu(menuItems, (choice) => {
    handlers[choice]?.();
  });
}
