export type NameStyleId =
  | "wide-thin"
  | "heavy-stacked"
  | "letter-rise"
  | "slice"
  | "decode"
  | "outline-fill"
  | "weight-sweep"
  | "particles";

export interface NameStyleProps {
  phase: "entering" | "active" | "exiting";
  text?: string;
  onEntered?: () => void;
  onExited?: () => void;
  onFailed?: () => void;
}

