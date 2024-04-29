import { Children, FC, ReactElement, ReactNode } from "react";
import { IMenuItemOptions } from "../../shared/ContextMenu";

export interface IContextMenuItemProps {
  label: string;
  onClick(): void;
}

export const ContextMenuItem: FC<IContextMenuItemProps> = () => {
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
  const handlers: { [choice: number]: VoidFunction } = {};
  const menuItems: IMenuItemOptions[] = Children.map(
    items.props.children,
    (child) => {
      if (!child || typeof child !== "object" || !("type" in child)) return;
      if (child.type === ContextMenuItem) {
        handlers[i++] = child.props.onClick;
        return {
          label: child.props.label as string,
        };
      }
      return null;
    }
  )!.filter((item) => !!item);

  gitjetCommon.showContextMenu(menuItems, (choice) => {
    handlers[choice]?.();
  });
}
