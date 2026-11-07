export type NameStyleId =
  | "wide-thin"
  | "heavy-stacked"
  | "marker-scrawl"
  | "slice"
  | "decode"
  | "outline-fill"
  | "weight-sweep"
  | "soft-blur"
  | "particles";

export interface NameStyleProps {
  phase: "entering" | "active" | "exiting";
  text?: string;
  onEntered?: () => void;
  onExited?: () => void;
  onFailed?: () => void;
}
