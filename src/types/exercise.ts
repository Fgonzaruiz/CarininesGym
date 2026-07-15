export interface Exercise {
  id: string;
  name: string;
  category: string;
  body_part: string;
  equipment: string;
  muscle_group: string;
  secondary_muscles: string[];
  target: string;
  instructions_es: string;
  steps_es: string[];
  image: string | null;
  gif: string | null;
  attribution: string;
}
