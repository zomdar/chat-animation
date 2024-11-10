export interface Message {
  id: string;
  type: "user" | "system";
  text: string;
}

export interface ResponseStream {
  id: string;
  words: string[];
  visibleCount: number;
}
