import { useCallback } from "react";

export interface IButtonProps extends React.PropsWithChildren {
  className?: string;
  onClick?(): void;
}

export function Button({ children, className, onClick }: IButtonProps) {
  const onButtonClick = useCallback(() => {
    if (onClick) {
      onClick();
    }
  }, [onClick]);

  let classNames = "buttonComponent";
  if (className) {
    classNames += " " + className;
  }

  return (
    <button className={classNames} onClick={onButtonClick}>
      {children}
    </button>
  );
}
